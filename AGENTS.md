# Instructions permanentes pour les agents

## Source de vérité

Lire `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md` et `TEST_PLAN.md` avant d'agir. Ces fichiers à la racine priment sur les anciennes notes du dossier `docs/`. Utiliser exclusivement PostgreSQL, Prisma et Resend. Aucune dépendance SQLite, Drizzle, Nodemailer, SMTP, Mailpit, SendGrid ou autre service de courriel.

## Travail multi-agent

- Le pilote découpe les tâches, attribue des fichiers distincts et reste responsable de l'intégration.
- Backend possède schéma, migrations et contrats serveur ; interface possède composants et styles ; QA possède tests et rapports. Aucun chevauchement sans coordination explicite.
- Avant le travail parallèle, écrire les contrats de routes/données et les dépendances dans `TASKS.md`.
- Un agent ne modifie pas les critères d'acceptation pour faire passer son code. Il rapporte les blocages avec une preuve reproductible.

## Sécurité et données

- Toutes les requêtes métier sont autorisées côté serveur par session, rôle et `companyId` issu de la session.
- Valider les entrées à la frontière ; requêtes Prisma paramétrées ; mots de passe hachés ; tokens de reset non stockés en clair.
- `RESEND_API_KEY` et `RESEND_WEBHOOK_SECRET` exclusivement côté serveur. Ne jamais les afficher, committer ou inclure dans des traces.
- Vérifier la signature du webhook sur le corps brut avant toute mutation ; dédupliquer avec identifiant fournisseur unique.
- Ne pas supprimer le volume PostgreSQL et ne jamais expédier de courriel à de vrais clients pendant les tests.

## Boucle de vérification

Pour chaque tranche : lire le scénario pertinent, implémenter, exécuter les tests ciblés sur PostgreSQL, ouvrir l'application dans un navigateur, corriger jusqu'au vert. Avant de finir, redémarrer Compose, refaire le parcours complet et rapporter les limites non vérifiées. Les mocks servent aux tests unitaires ; au moins un test réel Resend est requis avant l'acceptation de l'intégration.

## Déploiement

Avant toute opération de serveur, domaine, DNS, TLS ou Resend, lire le skill `labtest-production-ops` et ses références. Vérifier les valeurs propres à ce projet ; ne pas réutiliser aveuglément les chemins ou paramètres d'une autre application. Déployer uniquement sur demande explicite, via le workflow autorisé et avec vérification de santé.

## Interface

Suivre le plan validé de `DESIGN.md`. Approche mobile d'abord, focus clavier, contrastes WCAG AA clair/sombre, cibles ≥44 px et erreurs actionnables. Ne pas construire l'UI avant validation du plan visuel proposé.
