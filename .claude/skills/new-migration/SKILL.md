---
name: new-migration
description: Add a database change to Coach Hub safely — new Supabase migration file, RLS policies, offline tests in supabase/tests, and the backend-before-frontend rollout. Use for any schema, policy, trigger or RPC change.
---

# New migration

1. **Never edit an existing migration** that is on `origin/main` — it has been applied (a hook blocks it). Create `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_name>.sql` with a timestamp later than the newest file.
2. Write idempotent-enough SQL in the house style (see `20261006100000_push_notifications.sql`): header comment explaining why; `ENABLE ROW LEVEL SECURITY` on every new table; explicit `WITH CHECK` on write policies; `SECURITY DEFINER` functions with `SET search_path = public` and `REVOKE ... FROM PUBLIC, anon[, authenticated]` unless users must call them; helpers `is_my_client()`, `get_user_role()`, `get_assigned_coach_id()` instead of subqueries on `profiles` (recursion).
3. Add tests to `supabase/tests/*.test.ts` using `createTestDb()` from `supabase/tests/helpers.ts`: what each role may and may not read/write, and the attack you are preventing. Run `npx vitest run supabase`.
4. For a big or security-relevant change, run the `rls-reviewer` agent on the migration.
5. Frontend: tables missing from `src/integrations/supabase/types.ts` are queried via `from()` / `rpc()` in `src/lib/db.ts` (add the name to `UntypedTable` and a row interface).
6. Rollout: commit migration + tests to `main` first (frontend that uses it stays on a branch), then `/lovable-handoff`, verify, then merge the frontend. A hook asks before pushing a new migration together with `src/` changes to `main`.
