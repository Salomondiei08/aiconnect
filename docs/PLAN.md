# PLAN : ordre de construction

Chaque tâche n'est terminée que lorsque son test est vert. Coche la case, commit, passe à la suivante.

## Étape 0 : socle (environ 10 min)

- [ ] Scaffold hors du dossier (create-next-app refuse un dossier non vide), puis copie sans écraser :
  `npx create-next-app@latest /tmp/erp-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
  `rsync -a --ignore-existing --exclude .git /tmp/erp-scaffold/ ./`
- [ ] Dépendances : `npm i better-auth drizzle-orm @libsql/client nodemailer next-themes zod` et `npm i -D drizzle-kit @types/nodemailer @playwright/test`, puis `npx playwright install chromium`.
- [ ] `npx shadcn@latest init -d` puis les composants utiles (button, input, label, select, checkbox, card, table, dialog, sonner).
- [ ] Scripts `package.json` : `db:migrate` (applique le schéma Drizzle sur `DATABASE_URL`), `typecheck` (`tsc --noEmit`).
- [ ] Contrôle : `npx tsc --noEmit` passe et `npx playwright test --list` liste les 7 fichiers. Commit.

## Étape 1 : identité et page d'accueil → `e2e/01-landing.spec.ts`

- [ ] Choisir une identité (charger le skill `frontend-design`) : 4 à 6 couleurs en variables CSS, une ou deux polices via `next/font`. Pas de validation à attendre.
- [ ] `ThemeProvider` (`attribute="class"`) et bouton unique « thème ».
- [ ] Page `/` selon SPEC §3, mobile sans débordement.

## Étape 2 : base, auth, e-mails (socle invisible)

- [ ] Schéma Drizzle SPEC §10 + tables Better Auth.
- [ ] Better Auth : email/mot de passe, plugin `username`, champs utilisateur supplémentaires, `sendResetPassword`, rate limit coupé si `E2E=1`, refus de session si compte inactif.
- [ ] `lib/mail.ts` : nodemailer SMTP, texte + HTML, auth seulement si `SMTP_USER` est rempli.
- [ ] Helper serveur `requireSession()` qui renvoie `{ user, companyId }` ou redirige vers `/connexion`.

## Étape 3 : inscription → `e2e/02-signup.spec.ts`

- [ ] Formulaire 3 étapes SPEC §4, validation zod côté client et serveur.
- [ ] Action serveur : entreprise + « Boutique principale » + propriétaire Admin dans une transaction, session ouverte, e-mail « Bienvenue ».

## Étape 4 : connexion et mot de passe oublié → `e2e/03-auth.spec.ts`

- [ ] `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser`, messages SPEC §5.
- [ ] Protection des pages métier (layout du groupe protégé).

## Étape 5 : coquille et tableau de bord → `e2e/04-dashboard.spec.ts`

- [ ] Layout : menu latéral desktop, hamburger mobile, « Se déconnecter ».
- [ ] Cartes KPI avec `data-testid`, calculées en base, état vide.

## Étape 6 : utilisateurs → `e2e/05-users.spec.ts`

- [ ] Liste avec recherche, Effacer désactivé sur soi-même.
- [ ] Formulaire « Ajouter un utilisateur » blocs 1 à 3, règles RG1 à RG4.

## Étape 7 : produits et caisse → `e2e/06-products-sales.spec.ts`

- [ ] `/produits` : ajout et tableau avec `stock-qty`.
- [ ] `/ventes/nouvelle` : tuiles, panier, encaissement espèces, décrément du stock en transaction.

## Étape 8 : isolation → `e2e/07-tenancy.spec.ts`

- [ ] Relire chaque requête : filtre `company_id` partout.

## Étape 9 : finition

- [ ] `scripts/verify.sh` entièrement vert.
- [ ] `README.md` à jour (installation, variables, lancement).
- [ ] Commit final.
