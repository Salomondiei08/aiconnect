# ERP commercial

MVP de gestion pour commerçants. Les documents de référence sont `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md`, `TEST_PLAN.md` et `AGENTS.md`.

## Stack

Next.js App Router, TypeScript strict, PostgreSQL + Prisma, Resend Node SDK et React Email. Déploiement self-hosted Docker Compose avec Next.js, PostgreSQL persistant et Caddy. Aucun SMTP ni fournisseur transactionnel alternatif.

## Configuration

Copier `.env.example` vers `.env.local`, créer un secret d'authentification et configurer un expéditeur Resend sur un domaine vérifié. Ne jamais committer de valeurs réelles. Les courriels de test réel sont réservés à une boîte autorisée.

## Développement et livraison

Les commandes seront ajoutées avec le socle Docker/Prisma (voir `TASKS.md`). Exécuter les scénarios de `TEST_PLAN.md` et distinguer test unitaire, intégration PostgreSQL, appel réel Resend et réception en boîte. Pas de déploiement avant demande explicite et lecture du skill `labtest-production-ops`.
