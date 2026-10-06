/**
 * Shared PGlite setup for database tests: a minimal stub of Supabase's `auth` /
 * `storage` schemas and its default grants, every migration applied in order,
 * and a few seed users (two coaches, an invited client, an admin).
 */
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS = path.resolve(__dirname, "../migrations");

export const COACH = "11111111-1111-1111-1111-111111111111";
export const COACH2 = "22222222-2222-2222-2222-222222222222";
export const CLIENT = "33333333-3333-3333-3333-333333333333";
export const ADMIN = "44444444-4444-4444-4444-444444444444";

export async function createTestDb() {
  const db = new PGlite();
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
    GRANT USAGE ON SCHEMA public, auth TO authenticated, anon, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
    -- Supabase's default privileges on the public schema
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  `);
  for (const file of fs.readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, file), "utf8"));
  }
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES ('${COACH}', 'c@x'), ('${COACH2}', 'c2@x'), ('${ADMIN}', 'a@x');
    UPDATE public.profiles SET role = 'admin' WHERE id = '${ADMIN}';
    INSERT INTO public.client_invites (coach_id, email) VALUES ('${COACH}', 'k@x');
  `);
  const token = (await db.query<{ token: string }>("SELECT token FROM public.client_invites")).rows[0].token;
  await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ('${CLIENT}', 'k@x', '{"invite_token": "${token}"}');`);

  /** Runs `sql` in a transaction as the given user (role `authenticated`). */
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

  return { db, asUser, count };
}
