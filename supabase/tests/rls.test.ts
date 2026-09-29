// @vitest-environment node
/**
 * RLS regression tests: applies every migration to an in-memory Postgres (PGlite)
 * with a minimal stub of Supabase's `auth`/`storage` schemas, then runs queries
 * as specific users via `request.jwt.claim.sub`.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS = path.resolve(__dirname, "../migrations");

const COACH = "11111111-1111-1111-1111-111111111111";
const COACH2 = "22222222-2222-2222-2222-222222222222";
const CLIENT = "33333333-3333-3333-3333-333333333333";
const ADMIN = "44444444-4444-4444-4444-444444444444";
const SLOT = "aaaaaaaa-0000-0000-0000-000000000001";
const CAMPAIGN = "cccccccc-0000-0000-0000-000000000001";

let db: PGlite;

async function asUser<T = Record<string, unknown>>(uid: string, sql: string) {
  await db.exec(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${uid}', true);`);
  try {
    const res = await db.query<T>(sql);
    await db.exec("COMMIT");
    return res;
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}

const count = async (uid: string, sql: string) =>
  Number((await asUser<{ n: number }>(uid, `SELECT count(*)::int AS n FROM (${sql}) t`)).rows[0].n);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);
    CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid);
    CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array(name, '/') $$;
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
  `);
  for (const file of fs.readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, file), "utf8"));
  }
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    INSERT INTO auth.users (id, email) VALUES ('${COACH}', 'c@x'), ('${COACH2}', 'c2@x'), ('${ADMIN}', 'a@x');
    UPDATE public.profiles SET role = 'admin' WHERE id = '${ADMIN}';
    INSERT INTO public.client_invites (coach_id, email) VALUES ('${COACH}', 'k@x');
  `);
  const token = (await db.query<{ token: string }>("SELECT token FROM public.client_invites")).rows[0].token;
  await db.exec(`
    INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ('${CLIENT}', 'k@x', '{"invite_token": "${token}"}');
    INSERT INTO public.coach_slots (id, coach_id, start_time, end_time, capacity)
      VALUES ('${SLOT}', '${COACH}', now() + interval '1 day', now() + interval '1 day 1 hour', 2);
    INSERT INTO public.partners (id, name) VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'P');
    INSERT INTO public.promo_campaigns (id, partner_id, title) VALUES ('${CAMPAIGN}', 'bbbbbbbb-0000-0000-0000-000000000001', 'C');
  `);
}, 60_000);

describe("signup", () => {
  it("assigns invited clients to their coach", async () => {
    const { rows } = await db.query<{ role: string; assigned_coach_id: string }>(
      `SELECT role, assigned_coach_id FROM public.profiles WHERE id = '${CLIENT}'`);
    expect(rows[0]).toEqual({ role: "client", assigned_coach_id: COACH });
  });
});

describe("profiles", () => {
  it("blocks self-promotion to admin", async () => {
    await expect(asUser(COACH, `UPDATE profiles SET role = 'admin' WHERE id = '${COACH}'`)).rejects.toThrow(/ROLE_CHANGE_NOT_ALLOWED/);
  });
  it("blocks clients from switching coach", async () => {
    await expect(asUser(CLIENT, `UPDATE profiles SET assigned_coach_id = '${COACH2}' WHERE id = '${CLIENT}'`))
      .rejects.toThrow(/COACH_ASSIGNMENT_CHANGE_NOT_ALLOWED/);
  });
  it("allows ordinary profile edits", async () => {
    await asUser(CLIENT, `UPDATE profiles SET full_name = 'Karel', onboarding_done = true WHERE id = '${CLIENT}'`);
    expect(await count(ADMIN, `SELECT 1 FROM profiles WHERE full_name = 'Karel'`)).toBe(1);
  });
});

describe("bookings", () => {
  it("clients book via RPC but cannot insert directly", async () => {
    await asUser(CLIENT, `SELECT book_coach_slot('${SLOT}')`);
    await expect(asUser(CLIENT, `INSERT INTO slot_bookings (slot_id, client_id) VALUES ('${SLOT}', '${COACH2}')`))
      .rejects.toThrow(/row-level security/);
  });
  it("only the slot's coach sees and updates the booking", async () => {
    expect(await count(COACH, "SELECT 1 FROM slot_bookings")).toBe(1);
    expect(await count(COACH2, "SELECT 1 FROM slot_bookings")).toBe(0);
    expect((await asUser(COACH2, "UPDATE slot_bookings SET status = 'cancelled' RETURNING id")).rows).toHaveLength(0);
  });
  it("completing a booking consumes one package credit, once", async () => {
    await asUser(COACH, `INSERT INTO client_packages (coach_id, client_id, name, total_credits, remaining_credits)
      VALUES ('${COACH}', '${CLIENT}', '10 lekcí', 10, 3)`);
    await asUser(COACH, "UPDATE slot_bookings SET status = 'completed'");
    await asUser(COACH, "UPDATE slot_bookings SET status = 'completed'");
    const { rows } = await db.query<{ remaining_credits: number }>("SELECT remaining_credits FROM client_packages");
    expect(rows[0].remaining_credits).toBe(2);
  });
});

describe("partner program", () => {
  it("clients cannot join a challenge as already completed", async () => {
    await expect(asUser(CLIENT, `INSERT INTO client_challenges (campaign_id, client_id, status) VALUES ('${CAMPAIGN}', '${CLIENT}', 'completed')`))
      .rejects.toThrow(/row-level security/);
    await asUser(CLIENT, `INSERT INTO client_challenges (campaign_id, client_id, goal_target) VALUES ('${CAMPAIGN}', '${CLIENT}', 5)`);
    expect((await asUser(CLIENT, "UPDATE client_challenges SET status = 'completed' RETURNING id")).rows).toHaveLength(0);
  });
  it("users cannot grant themselves rewards or forge audit entries", async () => {
    await expect(asUser(CLIENT, `INSERT INTO reward_history (user_id, campaign_id) VALUES ('${CLIENT}', '${CAMPAIGN}')`))
      .rejects.toThrow(/row-level security/);
    await expect(asUser(CLIENT, `INSERT INTO partner_audit_log (entity_type, entity_id, action, actor_id)
      VALUES ('partner', '${COACH}', 'approved', '${ADMIN}')`)).rejects.toThrow(/row-level security/);
  });
  it("certificates must start as pending", async () => {
    await expect(asUser(COACH, `INSERT INTO coach_certificates (coach_id, certificate_url, status) VALUES ('${COACH}', 'u', 'approved')`))
      .rejects.toThrow(/row-level security/);
  });
});

describe("core domain", () => {
  it("coaches manage plans only for their own clients; clients see only published plans", async () => {
    await asUser(COACH, `INSERT INTO workout_plans (coach_id, client_id, title, status) VALUES ('${COACH}', '${CLIENT}', 'A', 'active')`);
    await asUser(COACH, `INSERT INTO workout_plans (coach_id, client_id, title) VALUES ('${COACH}', '${CLIENT}', 'Draft')`);
    await expect(asUser(COACH2, `INSERT INTO workout_plans (coach_id, client_id, title) VALUES ('${COACH2}', '${CLIENT}', 'X')`))
      .rejects.toThrow(/row-level security/);
    expect(await count(CLIENT, "SELECT 1 FROM workout_plans")).toBe(1);
    expect(await count(COACH2, "SELECT 1 FROM workout_plans")).toBe(0);
  });
  it("messages only flow between a client and their coach", async () => {
    await asUser(CLIENT, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${CLIENT}', 'Ahoj')`);
    await expect(asUser(CLIENT, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH2}', '${CLIENT}', '${CLIENT}', 'x')`))
      .rejects.toThrow(/row-level security/);
    await expect(asUser(COACH, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${CLIENT}', 'x')`))
      .rejects.toThrow(/row-level security/);
    expect(await count(COACH2, "SELECT 1 FROM messages")).toBe(0);
    await asUser(COACH, `SELECT mark_conversation_read('${COACH}', '${CLIENT}')`);
    expect(await count(ADMIN, "SELECT 1 FROM messages")).toBe(0); // private even to admins
    const { rows } = await db.query<{ n: number }>("SELECT count(*)::int AS n FROM messages WHERE read_at IS NOT NULL");
    expect(rows[0].n).toBe(1);
  });
  it("clients cannot create packages; coach records stay private", async () => {
    await expect(asUser(CLIENT, `INSERT INTO client_packages (coach_id, client_id, name, total_credits, remaining_credits)
      VALUES ('${COACH}', '${CLIENT}', 'free', 99, 99)`)).rejects.toThrow(/row-level security/);
    await asUser(COACH, `INSERT INTO coach_client_records (coach_id, client_id, notes) VALUES ('${COACH}', '${CLIENT}', 'secret')`);
    expect(await count(CLIENT, "SELECT 1 FROM coach_client_records")).toBe(0);
  });
  it("other coaches cannot read a client's intake or write their progress", async () => {
    await asUser(CLIENT, `INSERT INTO client_intake (client_id, goals) VALUES ('${CLIENT}', '{hubnuti}')`);
    expect(await count(COACH, "SELECT 1 FROM client_intake")).toBe(1);
    expect(await count(COACH2, "SELECT 1 FROM client_intake")).toBe(0);
    await expect(asUser(COACH2, `INSERT INTO progress_entries (client_id, weight) VALUES ('${CLIENT}', 80)`))
      .rejects.toThrow(/row-level security/);
  });
});
