#!/usr/bin/env bash
# Définition du « fini » : tout doit passer, dans cet ordre.
# Sortie volontairement courte : l'agent lit les premières erreurs, pas 2000 lignes.
set -uo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n== %s\n' "$1"; }
fail() { printf '\nÉCHEC : %s\n' "$1"; exit 1; }

step "Fichiers verrouillés (tests = contrat)"
shasum -a 256 -c .claude/locked.sha256 --quiet \
  || fail "e2e/, playwright.config.ts ou scripts/verify.sh ont changé. Restaure-les avec 'git checkout -- <fichier>' et corrige l'application, pas les tests."

[ -f package.json ] || fail "package.json absent : commence par docs/PLAN.md, étape 0."

step "Mailpit (e-mails de test)"
if ! curl -sf http://localhost:8025/api/v1/info >/dev/null; then
  command -v mailpit >/dev/null || fail "mailpit introuvable : brew install mailpit"
  nohup mailpit >/dev/null 2>&1 &
  for _ in $(seq 1 20); do curl -sf http://localhost:8025/api/v1/info >/dev/null && break; sleep 0.5; done
  curl -sf http://localhost:8025/api/v1/info >/dev/null || fail "Mailpit ne démarre pas"
fi

step "TypeScript"
out=$(npx tsc --noEmit 2>&1) || { echo "$out" | head -40; fail "erreurs TypeScript"; }

step "Lint"
out=$(npm run --silent lint --if-present 2>&1) || { echo "$out" | tail -40; fail "erreurs de lint"; }

step "Build de production"
mkdir -p .e2e
out=$(DATABASE_URL=file:.e2e/build.db BETTER_AUTH_SECRET=build-only-secret-0123456789abcdef \
  BETTER_AUTH_URL=http://localhost:3100 APP_URL=http://localhost:3100 E2E=1 npm run build 2>&1) \
  || { echo "$out" | tail -40; fail "le build échoue"; }

step "Tests d'acceptation (Playwright)"
# Un serveur resté ouvert sur 3100 ferait échouer le démarrage.
lsof -ti :3100 | xargs kill 2>/dev/null || true
out=$(npx playwright test --reporter=line 2>&1) \
  || { echo "$out" | grep -v '^\s*$' | tail -80; fail "tests e2e rouges (détail : npx playwright show-report)"; }
echo "$out" | tail -3

step "OK : tout est vert"
