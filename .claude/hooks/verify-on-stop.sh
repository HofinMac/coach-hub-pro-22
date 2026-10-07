#!/usr/bin/env bash
# Stop: before Claude reports back, typecheck and run DB tests when relevant files
# changed (uncommitted, or committed but not yet pushed). On failure, block once so
# Claude fixes it; never block twice in a row (stop_hook_active).
set -uo pipefail

input=$(cat)
root=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root"

changed=$( { git status --porcelain | awk '{print $NF}'; git diff --name-only '@{u}..HEAD' 2>/dev/null; } | sort -u)
[ -z "$changed" ] && exit 0

problems=""
if grep -qE '^(src/|vite\.config\.ts|tsconfig)' <<<"$changed"; then
  out=$(npx tsc --noEmit -p tsconfig.app.json 2>&1) || problems+=$'TypeScript (npx tsc --noEmit -p tsconfig.app.json):\n'"$(head -c 3000 <<<"$out")"$'\n\n'
fi
if grep -qE '^supabase/(migrations|tests)/' <<<"$changed"; then
  out=$(npx vitest run supabase 2>&1) || problems+=$'Testy databáze (npx vitest run supabase):\n'"$(tail -c 3000 <<<"$out")"$'\n'
fi

[ -z "$problems" ] && exit 0

if [ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ]; then
  jq -n --arg m "Kontrola stále hlásí chyby (tsc / testy DB) — viz výstup výše." '{systemMessage: $m}'
  exit 0
fi
jq -n --arg r "Automatická kontrola našla chyby, oprav je, než práci předáš:"$'\n\n'"$problems" '{decision: "block", reason: $r}'
