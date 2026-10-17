#!/usr/bin/env bash
# Définition du « fini » : tout doit passer, dans cet ordre.
# Sortie volontairement courte : l'agent lit les premières erreurs, pas 2000 lignes.
set -uo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n== %s\n' "$1"; }
fail() { printf '\nÉCHEC : %s\n' "$1"; exit 1; }
DEV_COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

step "Fichiers verrouillés (tests = contrat)"
shasum -a 256 -c .claude/locked.sha256 --quiet \
  || fail "e2e/, playwright.config.ts ou scripts/verify.sh ont changé. Restaure-les avec 'git checkout -- <fichier>' et corrige l'application, pas les tests."

[ -f package.json ] || fail "package.json absent : commence par le socle (TASKS.md T02)."

step "Variables Resend"
for var in RESEND_API_KEY RESEND_FROM_EMAIL; do
  grep -q "^$var=..*" .env.local 2>/dev/null || [ -n "${!var:-}" ] || fail "$var manquant dans .env.local"
done
command -v resend >/dev/null || fail "CLI resend introuvable (npm i -g resend-cli) : les tests lisent le statut fournisseur avec elle"

step "PostgreSQL (Docker Compose)"
"${DEV_COMPOSE[@]}" up -d --wait db >/dev/null 2>&1 || fail "le conteneur db ne démarre pas (docker compose ... up db)"
"${DEV_COMPOSE[@]}" exec -T db psql -q -U erp -d postgres \
  -c 'DROP DATABASE IF EXISTS erp_e2e WITH (FORCE)' -c 'CREATE DATABASE erp_e2e' >/dev/null \
  || fail "impossible de recréer la base erp_e2e"

step "TypeScript"
out=$(npx tsc --noEmit 2>&1) || { echo "$out" | head -40; fail "erreurs TypeScript"; }

step "Lint"
out=$(npm run --silent lint --if-present 2>&1) || { echo "$out" | tail -40; fail "erreurs de lint"; }

step "Tests unitaires"
out=$(npm run --silent test:unit 2>&1) || { echo "$out" | tail -40; fail "tests unitaires rouges (script test:unit requis)"; }

step "Build de production"
out=$(DATABASE_URL="postgresql://erp:erp_local_only@localhost:5434/erp_e2e?schema=public" \
  APP_URL=http://localhost:3100 E2E=1 npm run build 2>&1) \
  || { echo "$out" | tail -40; fail "le build échoue"; }

step "Tests d'acceptation (Playwright, vrais envois Resend)"
# Un serveur resté ouvert sur 3100 ferait échouer le démarrage.
lsof -ti :3100 | xargs kill 2>/dev/null || true
out=$(npx playwright test --reporter=line 2>&1) \
  || { echo "$out" | grep -v '^\s*$' | tail -80; fail "tests e2e rouges (détail : npx playwright show-report)"; }
echo "$out" | tail -3

step "OK : tout est vert"
