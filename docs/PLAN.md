# Plan d'implémentation

Le plan de tâches maintenu est maintenant `TASKS.md` à la racine. Il définit responsables, dépendances et statut selon les exigences PostgreSQL + Prisma + Resend.

Ordre : (1) contrats et décision visuelle, (2) Docker Compose Next.js/PostgreSQL/Caddy, santé et volume persistant, (3) Prisma, migrations et isolation d'entreprise, (4) authentification et courriels sécurisés, (5) produits, ventes, stock atomique, PDF et facture, (6) interface responsive après validation de `DESIGN.md`, (7) tests unitaire/intégration/navigateur et intégration réelle Resend, (8) déploiement self-hosted uniquement après demande explicite.

Chaque tâche se termine avec une preuve reproductible selon `TEST_PLAN.md`; compilation seule insuffisante.
