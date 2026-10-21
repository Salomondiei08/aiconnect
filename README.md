# Comptoir, ERP commercial

MVP de gestion pour commerçants (zone OHADA) : inscription en 3 étapes, connexion, mot de passe oublié, tableau de bord, utilisateurs et rôles, produits, caisse, facture PDF et e-mails transactionnels, plus un espace plateforme `/admin` réservé aux super-admins. Contrats : `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md`, `TEST_PLAN.md`, `AGENTS.md`, `docs/SPEC.md`.

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
npm run test:unit                             # Vitest : reprises, idempotence, signature, règles métier et plateforme
scripts/verify.sh                             # tout : typecheck, lint, unitaires, build, e2e Playwright
E2E_DEV=1 npx playwright test e2e/03-auth.spec.ts   # un fichier, boucle rapide
```

Les e2e utilisent une base `erp_e2e` recréée à chaque passe et envoient de **vrais e-mails Resend** vers les adresses de test `delivered+...@resend.dev`. Le statut fournisseur est lu avec la CLI `resend` (connectée avec vos identifiants, `resend login`). Avec `RESEND_TEST_TO`, un test envoie aussi dans votre boîte réelle. Chaque passe envoie une trentaine d'e-mails : surveillez le quota de votre plan Resend.

## Espace plateforme (`/admin`)

Zone d'exploitation au-dessus de toutes les entreprises : vue d'ensemble (entreprises, comptes, ventes, inscriptions, envois), entreprises et fiche détaillée (suspension / réactivation), comptes (activation, octroi ou retrait du droit super-admin, fermeture des sessions), journal des envois et journal des actions.

Le droit vient de `User.platformRole = 'platform_admin'` ou de la liste d'amorçage `PLATFORM_ADMIN_EMAILS` (adresses séparées par des virgules, comparées en minuscules) : à la première connexion d'une adresse listée, le rôle est écrit en base. Un compte connecté non autorisé est renvoyé vers `/tableau-de-bord`, un visiteur sans session vers `/connexion`. Toute action est enregistrée dans `PlatformAuditLog` (acteur, action, cible, entreprise, détails non secrets) ; la révocation du droit passe par `/admin/utilisateurs` et personne ne peut retirer son propre droit.

```bash
# .env.local ou .env.production
PLATFORM_ADMIN_EMAILS=votre-adresse@example.com
```

## Variables d'environnement

Voir `.env.example` : `DATABASE_URL`, `APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `RESEND_TEST_TO`, `PLATFORM_ADMIN_EMAILS`, et en production `POSTGRES_PASSWORD`, `APP_DOMAIN`.

## Production (Docker Compose)

```bash
# Sur le serveur : .env.production (RESEND_*, APP_URL=https://<domaine>) et POSTGRES_PASSWORD, APP_DOMAIN exportés
docker compose --profile prod up -d --build --wait
```

Le service `migrate` applique `prisma migrate deploy` avant le démarrage de l'application ; Caddy obtient le certificat TLS et sert `app:3000`. PostgreSQL n'est pas exposé hors du réseau Compose ; le volume `pgdata` est persistant. Déclarer le webhook Resend sur `https://<domaine>/api/webhooks/resend` et copier son secret dans `RESEND_WEBHOOK_SECRET`.

## Déploiement actuel : labtest

En ligne sur **https://comptoir.reinvent-labs.com**. Code dans `labtest:~/projects/comptoir` (copié par rsync, sans `.env`), secrets dans `.env` (POSTGRES_PASSWORD, APP_PORT) et `.env.production` (RESEND_*, APP_URL), mode 600. Le Caddy de l'hôte termine TLS et renvoie vers `127.0.0.1:3040`. Clé Resend `comptoir-labtest` (envoi seul, domaine `notify.reinvent-labs.com`) et webhook Resend vers `/api/webhooks/resend`.

```bash
rsync -az --exclude .git --exclude node_modules --exclude .next --exclude '.env*' --exclude src/generated ./ labtest:~/projects/comptoir/
ssh labtest 'cd ~/projects/comptoir && docker compose -p comptoir -f docker-compose.yml -f docker-compose.labtest.yml --profile prod up -d --build --wait db migrate app'
ssh labtest 'curl -fsS http://127.0.0.1:3040/api/health'
```

Ne jamais lancer `down -v` : le volume `comptoir_pgdata` contient les données. Les transcripts Claude de ce projet sont copiés dans `labtest:~/.claude/projects/-home-user-projects-comptoir/` : `cd ~/projects/comptoir && claude --continue` reprend la session sur le serveur.
