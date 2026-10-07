#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit|NotebookEdit): refuse edits to files that must
# not be changed by hand in this repo. Prints a deny decision with the reason.
set -euo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")
[ -z "$file" ] && exit 0

root=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
case "$file" in
  "$root"/*) rel=${file#"$root"/} ;;
  /*) exit 0 ;;
  *) rel=$file ;;
esac

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $r}}'
  exit 0
}

case "$rel" in
  src/integrations/*)
    deny "$rel je generovaný Lovable (Supabase klient, typy, auth). Neupravuj ho ručně — typy přegeneruje Lovable po migraci; pro nové tabulky použij from()/rpc() v src/lib/db.ts." ;;
  drizzle/*)
    deny "$rel spravuje Lovable (kopie spuštěných migrací). Nové změny DB patří do nové migrace v supabase/migrations/." ;;
  .env|.env.*)
    [ "$rel" = ".env.example" ] || deny "$rel obsahuje konfiguraci prostředí; neměň ji bez výslovného pokynu uživatele." ;;
  *.local|vapid-keys*)
    deny "$rel může obsahovat tajné klíče; nečti ani neupravuj ho." ;;
  supabase/migrations/*.sql)
    # A migration that is already on origin/main has (most likely) been applied by
    # Lovable; editing it would never reach the database. New/unpushed ones are fine.
    git -C "$root" fetch -q origin main 2>/dev/null || true
    if git -C "$root" cat-file -e "origin/main:$rel" 2>/dev/null; then
      deny "$rel už je na origin/main, takže ji Lovable nejspíš spustil. Změna by se do databáze nedostala — vytvoř novou migraci s novějším časovým razítkem."
    fi ;;
esac
exit 0
