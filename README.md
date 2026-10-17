# ERP

Application web de gestion pour commerçants (zone OHADA), construite par un agent IA à partir du cahier des charges EMYTEC. Ce dépôt contient d'abord le **kit** qui encadre l'agent : le contrat (`docs/SPEC.md`), le plan (`docs/PLAN.md`), les tests d'acceptation (`e2e/`) et les hooks qui empêchent l'agent de s'arrêter tant que tout n'est pas vert.

## Prérequis

Node 22+, npm, [Mailpit](https://mailpit.axllent.org/) (`brew install mailpit`).

## Installation et lancement

```bash
npm install
npx playwright install chromium
cp .env.example .env.local   # puis remplir BETTER_AUTH_SECRET
npm run db:migrate
mailpit &                    # e-mails visibles sur http://localhost:8025
npm run dev                  # http://localhost:3000
```

## Vérifier que tout marche

```bash
scripts/verify.sh            # typecheck, lint, build, tests e2e (port 3100)
```

Boucle rapide sur un seul fichier : `E2E_DEV=1 npx playwright test e2e/03-auth.spec.ts`.

## Variables d'environnement

Voir `.env.example` : `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. En production, les e-mails passent par Resend en SMTP.

## Mode autopilote

`touch .claude/autopilot.on` active deux hooks Claude Code : le hook Stop relance l'agent tant que `scripts/verify.sh` est rouge (25 fois maximum), le hook PreToolUse lui interdit de modifier les tests. Après avoir modifié un test à la main : `scripts/lock.sh`.

## Déploiement

Pas encore déployé. Cible prévue : serveur labtest (voir le skill `labtest-production-ops`).
