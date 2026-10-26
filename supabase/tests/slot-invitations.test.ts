// @vitest-environment node
/** Group lesson invitations: who may invite, capacity, answering in the app and by e-mail link. */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { CLIENT, COACH, COACH2, createTestDb } from "./helpers";

const SLOT = "aaaaaaaa-0000-0000-0000-0000000000f1";

let db: PGlite;
let asUser: Awaited<ReturnType<typeof createTestDb>>["asUser"];
let count: Awaited<ReturnType<typeof createTestDb>>["count"];

/** Runs as an anonymous visitor (the e-mail link page). */
async function asAnon<T = Record<string, unknown>>(sql: string) {
  await db.exec("BEGIN; SET LOCAL ROLE anon; SELECT set_config('request.jwt.claim.sub', '', true);");
  try {
    const res = await db.query<T>(sql);
    await db.exec("COMMIT");
    return res;
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}

const slot = async () =>
  (await db.query<{ booked_count: number; status: string }>(`SELECT booked_count, status FROM coach_slots WHERE id = '${SLOT}'`)).rows[0];
const tokenOf = async (where: string) =>
  (await db.query<{ token: string }>(`SELECT token FROM slot_invitations WHERE ${where}`)).rows[0].token;

beforeAll(async () => {
  ({ db, asUser, count } = await createTestDb());
  await db.exec(`
    UPDATE profiles SET full_name = 'Petr Trenér' WHERE id = '${COACH}';
    UPDATE profiles SET full_name = 'Karel Klient', email = 'karel@example.cz' WHERE id = '${CLIENT}';
    INSERT INTO coach_slots (id, coach_id, start_time, end_time, slot_type, capacity)
      VALUES ('${SLOT}', '${COACH}', now() + interval '2 days', now() + interval '2 days 1 hour', 'group', 2);
  `);
  await asUser(CLIENT, `SELECT register_push_subscription('https://push.example/k', 'p', 'a')`);
  await asUser(COACH, `SELECT register_push_subscription('https://push.example/c', 'p', 'a')`);
}, 60_000);

describe("inviting", () => {
  it("rejects malformed e-mail addresses", async () => {
    await expect(asUser(COACH, `SELECT * FROM invite_to_slot('${SLOT}', '{}', ARRAY['not-an-email'])`)).rejects.toThrow(/INVALID_EMAIL/);
  });

  it("only the slot's coach can invite, and only their own clients", async () => {
    await expect(asUser(COACH2, `SELECT * FROM invite_to_slot('${SLOT}', '{}', '{a@b.cz}')`)).rejects.toThrow(/SLOT_NOT_FOUND/);
    await expect(asUser(COACH, `SELECT * FROM invite_to_slot('${SLOT}', '{${COACH2}}', '{}')`)).rejects.toThrow(/NOT_YOUR_CLIENT/);
    await expect(asUser(CLIENT, `INSERT INTO slot_invitations (slot_id, coach_id, email) VALUES ('${SLOT}', '${COACH}', 'x@y.cz')`))
      .rejects.toThrow(/row-level security/);
  });

  it("creates app and e-mail invitations, dedupes, and maps a client's e-mail to the client", async () => {
    await db.exec("DELETE FROM notification_events");
    const { rows } = await asUser<{ client_id: string | null; email: string | null; name: string }>(COACH,
      `SELECT client_id, email, name FROM invite_to_slot('${SLOT}', ARRAY['${CLIENT}']::uuid[], ARRAY['Jana@Example.cz', 'jana@example.cz', 'Karel@example.cz', '', 'eva@example.cz'])`);
    // Karel@example.cz is CLIENT's profile e-mail → same person, deduped with the app invitation
    expect(rows.map(r => r.client_id ?? r.email).sort()).toEqual([CLIENT, "eva@example.cz", "jana@example.cz"].sort());
    expect((await db.query("SELECT 1 FROM slot_invitations")).rows).toHaveLength(3);
    const ev = (await db.query<{ user_id: string; title: string }>("SELECT user_id, title FROM notification_events")).rows;
    expect(ev).toEqual([{ user_id: CLIENT, title: "Pozvánka na lekci" }]);
  });

  it("the client sees own invitations, not others'; other coaches see nothing", async () => {
    expect(await count(CLIENT, "SELECT 1 FROM slot_invitations")).toBe(1);
    expect(await count(COACH2, "SELECT 1 FROM slot_invitations")).toBe(0);
    expect((await asUser(CLIENT, "SELECT * FROM get_my_slot_invitations()")).rows).toHaveLength(1);
  });
});

describe("answering", () => {
  it("an e-mail guest can accept anonymously; the coach is notified", async () => {
    await db.exec("DELETE FROM notification_events");
    const t = await tokenOf("email = 'jana@example.cz'");
    const info = (await asAnon<{ r: { status: string; coach_name: string } }>(`SELECT get_slot_invitation('${t}') AS r`)).rows[0].r;
    expect(info).toMatchObject({ status: "pending", coach_name: "Petr Trenér" });
    const r = (await asAnon<{ r: { status: string } }>(`SELECT respond_to_slot_invitation('${t}', true) AS r`)).rows[0].r;
    expect(r.status).toBe("accepted");
    expect(await slot()).toEqual({ booked_count: 1, status: "partially_booked" });
    const ev = (await db.query<{ user_id: string; title: string }>("SELECT user_id, title FROM notification_events")).rows;
    expect(ev).toEqual([{ user_id: COACH, title: "Pozvánka přijata" }]);
  });

  it("an app client accepting gets a confirmed booking without a misleading 'coach booked you' push", async () => {
    await db.exec("DELETE FROM notification_events");
    const t = await tokenOf(`client_id = '${CLIENT}'`);
    await asUser(CLIENT, `SELECT respond_to_slot_invitation('${t}', true)`);
    expect((await db.query(`SELECT 1 FROM slot_bookings WHERE slot_id = '${SLOT}' AND client_id = '${CLIENT}' AND status = 'confirmed'`)).rows).toHaveLength(1);
    expect(await slot()).toEqual({ booked_count: 2, status: "booked" });
    const ev = (await db.query<{ user_id: string }>("SELECT user_id FROM notification_events")).rows;
    expect(ev.map(e => e.user_id)).toEqual([COACH]);
  });

  it("refuses when the lesson is full", async () => {
    const t = await tokenOf("email = 'eva@example.cz'");
    await expect(asAnon(`SELECT respond_to_slot_invitation('${t}', true)`)).rejects.toThrow(/SLOT_FULL/);
    const info = (await asAnon<{ r: { full: boolean } }>(`SELECT get_slot_invitation('${t}') AS r`)).rows[0].r;
    expect(info.full).toBe(true);
  });

  it("changing an accept to a decline frees the seat (and cancels the app booking)", async () => {
    const t = await tokenOf(`client_id = '${CLIENT}'`);
    await asUser(CLIENT, `SELECT respond_to_slot_invitation('${t}', false)`);
    expect(await slot()).toEqual({ booked_count: 1, status: "partially_booked" });
    expect((await db.query(`SELECT status FROM slot_bookings WHERE client_id = '${CLIENT}'`)).rows).toEqual([{ status: "cancelled" }]);
    const t2 = await tokenOf("email = 'eva@example.cz'");
    await asAnon(`SELECT respond_to_slot_invitation('${t2}', true)`);
    expect(await slot()).toEqual({ booked_count: 2, status: "booked" });
  });

  it("answering twice the same way is a no-op; unknown tokens and past lessons are refused", async () => {
    const t2 = await tokenOf("email = 'eva@example.cz'");
    await asAnon(`SELECT respond_to_slot_invitation('${t2}', true)`);
    expect((await slot()).booked_count).toBe(2);
    await expect(asAnon(`SELECT respond_to_slot_invitation(gen_random_uuid(), true)`)).rejects.toThrow(/INVITATION_NOT_FOUND/);
    await db.exec(`UPDATE coach_slots SET start_time = now() - interval '1 hour' WHERE id = '${SLOT}'`);
    await expect(asAnon(`SELECT respond_to_slot_invitation('${t2}', false)`)).rejects.toThrow(/SLOT_CLOSED/);
  });

  it("anonymous visitors cannot list invitations or invite", async () => {
    expect((await asAnon("SELECT * FROM slot_invitations")).rows).toHaveLength(0);
    await expect(asAnon(`SELECT * FROM invite_to_slot('${SLOT}', '{}', '{a@b.cz}')`)).rejects.toThrow(/permission denied/);
  });
});

describe("seat accounting and abuse (review findings)", () => {
  const S2 = "aaaaaaaa-0000-0000-0000-0000000000f2";
  const seats = async () =>
    (await db.query<{ booked_count: number; status: string }>(`SELECT booked_count, status FROM coach_slots WHERE id = '${S2}'`)).rows[0];

  beforeAll(async () => {
    await db.exec(`INSERT INTO coach_slots (id, coach_id, start_time, end_time, slot_type, capacity)
      VALUES ('${S2}', '${COACH}', now() + interval '3 days', now() + interval '3 days 1 hour', 'group', 3)`);
  });

  it("a client who already booked doesn't take a second seat when accepting", async () => {
    await asUser(CLIENT, `SELECT book_coach_slot('${S2}')`);
    expect((await seats()).booked_count).toBe(1);
    await asUser(COACH, `SELECT * FROM invite_to_slot('${S2}', ARRAY['${CLIENT}']::uuid[], '{}')`);
    const t = await tokenOf(`slot_id = '${S2}' AND client_id = '${CLIENT}'`);
    await asUser(CLIENT, `SELECT respond_to_slot_invitation('${t}', true)`);
    expect((await seats()).booked_count).toBe(1);
  });

  it("cancelling in the app then declining by link releases the seat only once", async () => {
    const bookingId = (await db.query<{ id: string }>(`SELECT id FROM slot_bookings WHERE slot_id = '${S2}' AND client_id = '${CLIENT}'`)).rows[0].id;
    await asUser(CLIENT, `SELECT cancel_client_booking('${bookingId}')`);
    expect((await seats()).booked_count).toBe(0);
    expect((await db.query(`SELECT status FROM slot_invitations WHERE slot_id = '${S2}' AND client_id = '${CLIENT}'`)).rows)
      .toEqual([{ status: "declined" }]);
    const t = await tokenOf(`slot_id = '${S2}' AND client_id = '${CLIENT}'`);
    await asAnon(`SELECT respond_to_slot_invitation('${t}', false)`);
    expect((await seats()).booked_count).toBe(0);
  });

  it("withdrawn invitations still count towards the e-mail limits and can't be deleted", async () => {
    await expect(asUser(COACH, `DELETE FROM slot_invitations WHERE slot_id = '${S2}' RETURNING id`)).resolves.toMatchObject({ rows: [] });
    const emails = Array.from({ length: 45 }, (_, i) => `'spam${i}@example.cz'`).join(",");
    await asUser(COACH, `SELECT * FROM invite_to_slot('${S2}', '{}', ARRAY[${emails}])`);
    const ids = (await db.query<{ id: string }>(`SELECT id FROM slot_invitations WHERE slot_id = '${S2}' AND email LIKE 'spam%'`)).rows;
    for (const { id } of ids) await asUser(COACH, `SELECT withdraw_slot_invitation('${id}')`);
    await expect(asUser(COACH, `SELECT * FROM invite_to_slot('${S2}', '{}', ARRAY['one.more@example.cz', 'two.more@example.cz', 'three@example.cz', 'four@example.cz', 'five@example.cz'])`))
      .rejects.toThrow(/TOO_MANY_INVITATIONS/);
    // withdrawn links are dead
    const t = (await db.query<{ token: string }>(`SELECT token FROM slot_invitations WHERE email = 'spam0@example.cz'`)).rows[0].token;
    await expect(asAnon(`SELECT respond_to_slot_invitation('${t}', true)`)).rejects.toThrow(/INVITATION_NOT_FOUND/);
  });

  it("manually occupied slots can't be invited to and answers never reopen them", async () => {
    const S3 = "aaaaaaaa-0000-0000-0000-0000000000f3";
    await db.exec(`INSERT INTO coach_slots (id, coach_id, start_time, end_time, slot_type, capacity, status, manual_client_name)
      VALUES ('${S3}', '${COACH}', now() + interval '4 days', now() + interval '4 days 1 hour', 'group', 2, 'booked', 'Pavel')`);
    await expect(asUser(COACH, `SELECT * FROM invite_to_slot('${S3}', '{}', ARRAY['x@example.cz'])`)).rejects.toThrow(/SLOT_MANUALLY_OCCUPIED/);
  });

  it("flip-flopping answers sends the coach one push per 5 minutes", async () => {
    await asUser(COACH, `SELECT * FROM invite_to_slot('${S2}', '{}', ARRAY['flip@example.cz'])`);
    const t = await tokenOf(`email = 'flip@example.cz'`);
    await db.exec("DELETE FROM notification_events");
    for (let i = 0; i < 5; i++) {
      await asAnon(`SELECT respond_to_slot_invitation('${t}', ${i % 2 === 0})`);
    }
    expect((await db.query("SELECT 1 FROM notification_events")).rows).toHaveLength(1);
    expect((await seats()).booked_count).toBe(1); // ended on accept
  });
});
