# Instructions agent ERP

Lire et suivre `AGENTS.md`, puis `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md` et `TEST_PLAN.md`. Les contrats à la racine font autorité. Utiliser exclusivement PostgreSQL + Prisma + Resend pour les courriels. Les anciennes notes sous `docs/` ne peuvent pas remplacer ces contrats.

Utiliser plusieurs sous-agents uniquement avec responsabilités et fichiers séparés ; l'agent pilote reste responsable de l'intégration. Attendre la validation du plan visuel de `DESIGN.md` avant de construire l'interface. Ne pas déployer sans demande explicite ni pousser sans autorisation.

## Contrat des tests

Les critères d'acceptation des documents racine sont exacts. Ne pas modifier les tests pour les contourner. Une fonctionnalité n'est terminée qu'après vérification dans l'application et dans PostgreSQL ; compilation seule insuffisante. Respecter `TEST_PLAN.md` et rapporter les étapes qui ne sont pas vérifiées.

## Pile imposée

Next.js App Router, TypeScript strict, PostgreSQL, Prisma, Resend Node SDK et React Email. Interdits : SQLite, Drizzle, Nodemailer, SMTP, Mailpit, SendGrid, Supabase, Vercel et Firebase. Secrets uniquement dans l'environnement serveur et jamais dans Git.
