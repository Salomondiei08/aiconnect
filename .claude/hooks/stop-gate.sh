#!/usr/bin/env bash
# Hook Stop : l'agent ne peut pas s'arrêter tant que scripts/verify.sh n'est pas vert.
# Actif seulement si .claude/autopilot.on existe (on l'allume au début du live).
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -f .claude/autopilot.on ] || exit 0

MAX=25
counter=.claude/.stop-count
n=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$counter"
if [ "$n" -gt "$MAX" ]; then
  echo "Plafond de $MAX relances atteint : arrêt autorisé, fais le point pour l'humain." >&2
  exit 0
fi

out=$(scripts/verify.sh 2>&1)
if [ $? -eq 0 ]; then
  rm -f "$counter"
  exit 0
fi

{
  echo "PAS FINI (relance $n/$MAX) : scripts/verify.sh est rouge. Corrige l'application et continue sans poser de question."
  echo "Ne modifie jamais e2e/, playwright.config.ts, scripts/verify.sh ni .claude/."
  echo
  echo "$out" | tail -n 80
} >&2
exit 2
