# Architecture

## Stack imposée

- Next.js App Router, TypeScript strict, React, Tailwind et shadcn/ui restylé.
- PostgreSQL comme seule base applicative ; Prisma comme seul ORM et outil de migration.
- Resend Node.js SDK comme seul fournisseur d'e-mails transactionnels ; React Email pour les gabarits.
- Docker Compose : conteneurs Next.js, PostgreSQL et Caddy ; volume PostgreSQL nommé et persistant. Aucun serveur SMTP, Supabase, Vercel ou Firebase.
- Caddy termine TLS et reverse-proxy vers Next.js lié au réseau privé Docker.

## Données principales

`Company`, `Location`, `User`, `Product`, `Sale`, `SaleItem`, `StockMovement`, `EmailDelivery`, `EmailWebhookEvent`, `PasswordResetToken`, `VerificationToken`.
Toutes les entités commerciales portent `companyId`. Les lectures et écritures vérifient la société depuis la session côté serveur ; ne jamais faire confiance à `companyId` reçu du navigateur.
Les ventes, lignes et mouvements de stock sont écrits dans une transaction Prisma. Prix en unités entières XOF.
`EmailDelivery` conserve type, destinataire, statut interne, identifiant Resend, tentative, erreur expurgée, dates et clé d'idempotence. Les événements webhook conservent l'identifiant événement unique et son horodatage ; aucune donnée secrète.

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
