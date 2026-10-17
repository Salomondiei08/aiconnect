#!/usr/bin/env bash
# Hook PreToolUse : interdit à l'agent d'écrire dans les tests, la config Playwright, verify.sh et .claude/.
# Lire ou lancer les tests reste permis. Actif seulement si .claude/autopilot.on existe.
root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$root/.claude/autopilot.on" ] || exit 0

input=$(cat)
read_field() {
  printf '%s' "$input" | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      const t = (JSON.parse(s).tool_input) || {};
      process.stdout.write(String(t[process.argv[1]] ?? ""));
    });' "$1"
}

locked='(^|[ /"'"'"'])(e2e/|playwright\.config\.ts|scripts/verify\.sh|scripts/lock\.sh|\.claude/)'
deny() { echo "Fichier verrouillé ($1) : les tests sont le contrat. Corrige l'application, pas les tests." >&2; exit 2; }

path=$(read_field file_path)
[ -z "$path" ] && path=$(read_field notebook_path)
if [ -n "$path" ]; then
  rel="${path#"$root"/}"
  printf '%s' "$rel" | grep -Eq '^(e2e/|playwright\.config\.ts$|scripts/(verify|lock)\.sh$|\.claude/)' && deny "$rel"
  exit 0
fi

cmd=$(read_field command)
if [ -n "$cmd" ] && printf '%s' "$cmd" | grep -Eq "$locked"; then
  # Commandes qui écrivent ou suppriment. « 2>&1 » et « >/dev/null » restent permis ; git checkout/restore aussi (ça restaure).
  if printf '%s' "$cmd" | sed -E 's/[0-9]?>&[0-9]//g; s#>[ ]*/dev/null##g' \
     | grep -Eq '(sed -i|perl -i|>|\btee\b|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\bchmod\b|\bunlink\b|writeFile)'; then
    deny "commande Bash"
  fi
fi
exit 0
