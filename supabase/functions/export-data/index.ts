// TEMPORARY — one-off export of all data for the move from Lovable Cloud to our own
// Supabase project (docs/MIGRACE-SUPABASE.md). Delete the function and the
// EXPORT_TOKEN secret right after the export.
//
// POST with header `x-export-token: <EXPORT_TOKEN>` → JSON with every row of the
// public schema, auth users + identities (incl. password hashes, so people keep
// their passwords) and signed download URLs for all storage files.
import postgres from "npm:postgres@3.4.9";
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPORT_TOKEN = Deno.env.get("EXPORT_TOKEN") ?? "";
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const token = req.headers.get("x-export-token") ?? "";
  if (EXPORT_TOKEN.length < 32 || !safeEqual(token, EXPORT_TOKEN)) return json({ error: "Unauthorized" }, 401);

  const sql = postgres(DB_URL, { prepare: false, max: 1 });
  try {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;
    const publicData: Record<string, unknown[]> = {};
    for (const { table_name } of tables) {
      publicData[table_name] = await sql.unsafe(`SELECT * FROM public."${table_name.replace(/"/g, '""')}"`);
    }

    const authUsers = await sql`SELECT * FROM auth.users`;
    const authIdentities = await sql`SELECT * FROM auth.identities`;
    const objects = await sql<{ bucket_id: string; name: string; metadata: unknown }[]>`
      SELECT bucket_id, name, metadata FROM storage.objects ORDER BY bucket_id, name`;
    const buckets = await sql`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets`;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const files = [];
    for (const o of objects) {
      const { data } = await admin.storage.from(o.bucket_id).createSignedUrl(o.name, 60 * 60 * 6);
      files.push({ bucket: o.bucket_id, path: o.name, metadata: o.metadata, url: data?.signedUrl ?? null });
    }

    return json({
      exported_at: new Date().toISOString(),
      public: publicData,
      auth: { users: authUsers, identities: authIdentities },
      storage: { buckets, files },
    });
  } catch (err) {
    console.error("export-data error", err);
    return json({ error: String(err) }, 500);
  } finally {
    await sql.end();
  }
});
