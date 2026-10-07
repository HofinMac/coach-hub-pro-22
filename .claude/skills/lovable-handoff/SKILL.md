---
name: lovable-handoff
description: Prepare exact copy-paste prompts for Lovable to apply migrations, deploy edge functions or set secrets in the Lovable Cloud backend of Coach Hub, plus verification queries. Use whenever a change needs the database/functions (we cannot reach them ourselves), e.g. "připrav kroky pro Lovable", after adding a migration or edge function, or before merging frontend that depends on new tables.
---

# Lovable handoff

The Supabase project (`oqtxwelesrwmvvurzslj`) runs in **Lovable Cloud**: Claude Code cannot run SQL, deploy functions or set secrets there. Jiří pastes prompts into the Lovable chat. Lovable tends to "improve" things (it once generated its own VAPID keys and edited a function), so every prompt must forbid changes.

## Steps

1. Find what Lovable has to do:
   - `git fetch -q origin main`
   - New migrations not yet applied: files in `supabase/migrations/` compared with `drizzle/migrations/` (Lovable mirrors each migration it ran there, e.g. `0002_push_notifications.sql`). Ask Jiří if unsure.
   - Changed edge functions: `git diff --name-only <last handoff>..HEAD -- supabase/functions`
   - New secrets: `Deno.env.get(...)` names in changed functions.
2. The files must be **on `main`** first — Lovable only sees `main`. Ship backend files (migration, function, `supabase/config.toml`, tests) to `main` before the frontend that needs them.
3. Write one numbered step per action, each with a prompt in a quote block, in Czech, in this form:

   > Spusť prosím SQL ze souboru `supabase/migrations/<file>.sql` jako migraci databáze, přesně beze změn. Nic jiného v aplikaci neměň. Pokud vypíše chyby nebo upozornění (NOTICE/WARNING), ukaž mi je.

   > Nasaď edge funkci `supabase/functions/<name>` přesně podle repozitáře (nastavení z `supabase/config.toml`). Kód funkce ani aplikace neměň.

   > Otevři mi formulář pro secrets `<NAME>` — hodnoty vložím sám. Žádné hodnoty negeneruj.

   Secret values never go into the chat or a prompt: tell Jiří where the value is (e.g. a local `*.local` file) and to paste it into the form only.
4. Add a verification step with a read-only SQL query whose expected result you state (e.g. table count, `select jobname, schedule from cron.job`, `select tgname from pg_trigger where ...`).
5. After Jiří reports back, verify yourself where possible:
   - `git log origin/main` / `git diff` — did Lovable change any files beyond `drizzle/` and `src/integrations/supabase/types.ts`? If it touched code, review the diff.
   - Edge functions: `curl -s -X POST https://oqtxwelesrwmvvurzslj.supabase.co/functions/v1/<name> -d '{}'` (404 = not deployed).
   - Tables: `curl -s "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1" -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY"` (values from `.env`; `[]` = exists, `PGRST205` = missing).
6. Only then merge the frontend that depends on it.

Things Lovable cannot do (tell Jiří to click them himself): Auth redirect URLs — More → Cloud → Users → Auth settings → Advanced → Redirect URLs.
