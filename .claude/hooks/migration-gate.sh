#!/usr/bin/env bash
# PreToolUse (Bash, git push): pushing a new migration together with app code to
# main is risky — Lovable has to run the migration first, otherwise production
# queries fail. Asks for confirmation in that case.
set -uo pipefail

input=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
grep -qE '(^|[;&| ])git push' <<<"$cmd" || exit 0

root=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root"
branch=$(git branch --show-current)
grep -qw main <<<"$cmd" || [ "$branch" = "main" ] || exit 0

git fetch -q origin main 2>/dev/null || true
files=$(git diff --name-only origin/main...HEAD 2>/dev/null)
new_migrations=$(git diff --name-only --diff-filter=A origin/main...HEAD -- supabase/migrations 2>/dev/null)
[ -n "$new_migrations" ] || exit 0
grep -q '^src/' <<<"$files" || exit 0

jq -n --arg r "Push do main obsahuje novou migraci ($(tr '\n' ' ' <<<"$new_migrations")) i změny aplikace v src/. Produkce by volala tabulky/funkce, které ještě nemusí existovat. Postup: nejdřív migraci (a funkce) do main, nechat je spustit v Lovable (/lovable-handoff), ověřit, a teprve pak frontend. Pokračovat jen pokud je migrace už spuštěná." \
  '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $r}}'
