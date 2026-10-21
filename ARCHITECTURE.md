# Architecture

## Stack imposée

- Next.js App Router, TypeScript strict, React, Tailwind et shadcn/ui restylé.
- PostgreSQL comme seule base applicative ; Prisma comme seul ORM et outil de migration.
- Resend Node.js SDK comme seul fournisseur d'e-mails transactionnels ; React Email pour les gabarits.
- Docker Compose : conteneurs Next.js, PostgreSQL et Caddy ; volume PostgreSQL nommé et persistant. Aucun serveur SMTP, Supabase, Vercel ou Firebase.
- Caddy termine TLS et reverse-proxy vers Next.js lié au réseau privé Docker.

## Données principales

`Company`, `Location`, `User`, `Product`, `Sale`, `SaleItem`, `StockMovement`, `EmailDelivery`, `EmailWebhookEvent`, `PasswordResetToken`, `VerificationToken`, `PlatformAuditLog`.
Toutes les entités commerciales portent `companyId`. Les lectures et écritures vérifient la société depuis la session côté serveur ; ne jamais faire confiance à `companyId` reçu du navigateur.
Les ventes, lignes et mouvements de stock sont écrits dans une transaction Prisma. Prix en unités entières XOF.
`EmailDelivery` conserve type, destinataire, statut interne, identifiant Resend, tentative, erreur expurgée, dates et clé d'idempotence. Les événements webhook conservent l'identifiant événement unique et son horodatage ; aucune donnée secrète.

`Company.status` vaut `active` ou `suspended` ; une entreprise suspendue coupe l'accès à tous ses comptes (vérifié dans `getCurrentUser`, sessions détruites à la suspension). `User.platformRole` vaut `platform_admin` ou `null` : c'est un droit **additif** qui n'élargit aucun rôle métier. `PlatformAuditLog` conserve acteur, action, cible (entreprise ou compte), entreprise concernée et détails non secrets.

## Espace plateforme (`/admin`)

Couche d'exploitation au-dessus de l'isolation par entreprise, réservée aux super-admins :

- **Accès** : `isPlatformAdmin(user)` = `User.platformRole === "platform_admin"` **ou** adresse présente dans `PLATFORM_ADMIN_EMAILS` (liste d'amorçage séparée par virgules, comparée en minuscules). La règle pure vit dans `src/lib/platform-rules.ts` (testée unitairement) ; son application serveur dans `src/lib/platform.ts` (`server-only`), avec `requirePlatformAdmin()` qui redirige un compte connecté non autorisé vers `/tableau-de-bord` et un visiteur sans session vers `/connexion`.
- **Amorçage** : à la connexion, `syncPlatformRole()` écrit le rôle en base pour une adresse listée (une seule écriture). Retirer une adresse de la variable ne révoque rien : la révocation passe par `/admin/utilisateurs`, où elle est journalisée. Un super-admin ne peut pas retirer son propre droit.
- **Lectures** : `src/lib/admin.ts` (`server-only`) est le seul module à traverser toutes les entreprises — agrégats par entreprise, séries d'inscriptions, volumes, journal des envois et des actions. Chaque page commence par `requirePlatformAdmin()`.
- **Écritures** : `src/lib/actions/platform.ts` — statut d'entreprise, activation d'un compte, octroi/retrait du droit plateforme, fermeture de sessions. Chaque action vérifie le droit, journalise dans `PlatformAuditLog`, détruit les sessions concernées quand l'accès est retiré, puis `revalidatePath`. Aucune donnée secrète ni contenu de courriel n'est journalisé.
- **Interface** : routes `/admin`, `/admin/entreprises`, `/admin/entreprises/[id]`, `/admin/utilisateurs`, `/admin/emails`, `/admin/journal` sous `src/app/(admin)/`, coquille distincte (barre latérale marine, badge plateforme) et `robots: noindex`.

## Flux API / sécurité

- Mutations via Server Actions ou routes API Next.js côté serveur, validation Zod et autorisation par rôle et `companyId`.
- Resend SDK uniquement dans un module serveur (`server-only`). Clé API jamais incluse dans un bundle/client.
- Webhook Resend : lire le corps brut, vérifier la signature avec `RESEND_WEBHOOK_SECRET`/Svix avant traitement, rejeter les signatures invalides, insérer l'événement de façon idempotente puis mettre à jour l'envoi.
- Réinitialisation : jeton aléatoire à haute entropie, empreinte seule en base, expiration et consommation atomique à usage unique.
- PDF généré côté serveur, limité aux données de l'entreprise et joint au message facture.
- Ne jamais journaliser clés, jetons, contenu complet des courriels ni données personnelles non nécessaires.

## Envoi, reprises et livraison

Créer l'enregistrement d'envoi avant la requête fournisseur avec une clé d'idempotence stable. Enregistrer l'ID renvoyé par Resend. Une réponse API positive signifie « accepté par le fournisseur », jamais « livré ». Seuls les webhooks signés font passer au statut livré/rejeté. Reprises bornées avec délai progressif uniquement sur erreurs transitoires ; réutiliser l'idempotence du message lorsque supportée. Ne pas relancer un envoi déjà accepté sans stratégie qui évite un doublon.

## Conteneurs

PostgreSQL n'est publié que sur le réseau privé Compose. Secrets injectés par environnement au déploiement, jamais copiés dans l'image. Healthchecks pour DB et app ; migrations Prisma exécutées explicitement avant le démarrage de la version applicative. Caddy et Next.js communiquent dans Compose ; aucune exposition directe de PostgreSQL.
