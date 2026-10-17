# ERP : règles de l'agent

Tu construis seul, sans t'arrêter, l'application décrite dans `docs/SPEC.md`, en suivant `docs/PLAN.md` dans l'ordre.

## Mode autonome

1. Ne pose aucune question et n'attends aucune validation (y compris pour le design) : choisis la solution la plus simple qui respecte la SPEC et avance.
2. Si une information manque, prends une décision raisonnable, note-la en une ligne dans `docs/DECISIONS.md`, continue.
3. Ne pousse jamais (`git push` interdit). Commits locaux uniquement.

## Les tests sont le contrat

1. `e2e/*.spec.ts` décrit ce qui doit marcher. Ces fichiers, `playwright.config.ts`, `scripts/verify.sh` et `.claude/` sont **verrouillés** : tu ne les modifies jamais. Si un test semble faux, adapte l'application aux libellés de la SPEC ; ne contourne pas le test.
2. Les libellés, routes, messages et `data-testid` de `docs/SPEC.md` sont exacts : copie-les.
3. « Fini » veut dire une seule chose : `scripts/verify.sh` sort en vert (typecheck, lint, build, tous les tests e2e). Tant que ce n'est pas le cas, un hook te relance automatiquement.
4. Ne dis jamais qu'une fonctionnalité marche sans l'avoir vue passer dans un test.

## Boucle de travail (pour chaque tâche de PLAN.md)

1. Lis le fichier de test de la tâche avant d'écrire du code.
2. Implémente le minimum qui le fait passer.
3. Lance le test ciblé en boucle rapide : `E2E_DEV=1 npx playwright test e2e/0X-xxx.spec.ts --reporter=line`.
4. Rouge : lis l'erreur, regarde la trace (`npx playwright show-trace test-results/.../trace.zip`) ou la capture, corrige, relance. Ne passe pas à la tâche suivante tant que c'est rouge.
5. Vert : coche la case dans `docs/PLAN.md`, puis `git add -A && git commit -m "feat: ..."` (un commit par tâche, sans ligne Co-Authored-By).
6. Toutes les 2 tâches, et à la fin : `scripts/verify.sh` complet.

## Technique

1. Next.js App Router, TypeScript strict, shadcn/ui restylé (identité propre au produit, pas le look par défaut), Tailwind, `next-themes`.
2. Better Auth (email/mot de passe + plugin `username` + reset), Drizzle + SQLite (`@libsql/client`), `nodemailer` en SMTP. Pas d'autre dépendance sans raison.
3. Toute requête métier passe par une fonction serveur qui lit la session et filtre par `company_id`.
4. Mobile d'abord : vérifier 360 px, cibles tactiles de 44 px minimum.
5. Mots de passe hachés par Better Auth, aucun secret dans le code ni dans git (`.env*` ignorés).
6. E-mails en développement : Mailpit (`localhost:1025`, interface sur http://localhost:8025).
