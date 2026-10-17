# Comptoir, ERP commercial

MVP de gestion pour commerçants (zone OHADA) : inscription en 3 étapes, connexion, mot de passe oublié, tableau de bord, utilisateurs et rôles, produits, caisse, facture PDF et e-mails transactionnels. Contrats : `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md`, `TEST_PLAN.md`, `AGENTS.md`, `docs/SPEC.md`.

## Stack

Next.js 16 (App Router), TypeScript strict, Tailwind + shadcn/ui restylé, PostgreSQL + Prisma 7, Resend (SDK Node) + React Email, pdf-lib. Production self-hosted : Docker Compose (Next.js, PostgreSQL, Caddy). Aucun SMTP.

## Développement

```bash
npm install                                   # génère aussi le client Prisma
cp .env.example .env.local                    # puis remplir RESEND_*
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --wait db
npm run db:dev                                # applique les migrations
npm run dev                                   # http://localhost:3000
```

## Tests

```bash
npm run test:unit                             # Vitest : reprises, idempotence, signature, règles métier
scripts/verify.sh                             # tout : typecheck, lint, unitaires, build, e2e Playwright
E2E_DEV=1 npx playwright test e2e/03-auth.spec.ts   # un fichier, boucle rapide
```

Les e2e utilisent une base `erp_e2e` recréée à chaque passe et envoient de **vrais e-mails Resend** vers les adresses de test `delivered+...@resend.dev`. Le statut fournisseur est lu avec la CLI `resend` (connectée avec vos identifiants, `resend login`). Avec `RESEND_TEST_TO`, un test envoie aussi dans votre boîte réelle. Chaque passe envoie une trentaine d'e-mails : surveillez le quota de votre plan Resend.

## Variables d'environnement

Voir `.env.example` : `DATABASE_URL`, `APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `RESEND_TEST_TO`, et en production `POSTGRES_PASSWORD`, `APP_DOMAIN`.

## Production (Docker Compose)

```bash
# Sur le serveur : .env.production (RESEND_*, APP_URL=https://<domaine>) et POSTGRES_PASSWORD, APP_DOMAIN exportés
docker compose --profile prod up -d --build --wait
```

Le service `migrate` applique `prisma migrate deploy` avant le démarrage de l'application ; Caddy obtient le certificat TLS et sert `app:3000`. PostgreSQL n'est pas exposé hors du réseau Compose ; le volume `pgdata` est persistant. Déclarer le webhook Resend sur `https://<domaine>/api/webhooks/resend` et copier son secret dans `RESEND_WEBHOOK_SECRET`. Pas encore déployé : voir le skill `labtest-production-ops`.
