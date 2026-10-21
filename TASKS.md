# Tâches

| ID | Tâche | Responsable | Dépendances | Statut |
|---|---|---|---|---|
| T01 | Remplacer les références SQLite/SMTP/Mailpit dans les contrats, configuration et harnais de test par PostgreSQL/Prisma/Resend | Pilote | — | Fait |
| T02 | Créer Compose Next.js + PostgreSQL + Caddy, healthchecks et volume persistant | Backend | T01 | Fait (Compose db/migrate/app/Caddy, healthchecks, volume ; persistance vérifiée après down/up) |
| T03 | Modèle Prisma, migrations et isolation entreprise | Backend | T02 | Fait |
| T04 | Auth, inscription, vérification et récupération sécurisée | Backend | T03 | Fait (confirmation d'adresse, limitation des tentatives, voir/modifier, exports, journal d'activité) |
| T05 | Module serveur Resend, gabarits React Email et journal des envois | Backend | T03 | Fait |
| T06 | Webhook signé, idempotence et reprises bornées | Backend | T05 | Fait |
| T07 | Produits, caisse, stock atomique, reçu PDF et courriel de facture | Backend | T03,T05 | Fait |
| T08 | Interface responsive après validation DESIGN.md | Interface | T01 | Fait (design inspiré de Reinvent Labs Academy, validé par le porteur) |
| T09 | Tests unitaires, PostgreSQL d'intégration, e2e et boîte Resend autorisée | QA | T02–T08 | Fait (29 unitaires, 40 e2e dont 1 boîte réelle) |
| T10 | Déploiement self-hosted et vérification domaine/Resend via skill | Pilote | T09 | Fait : https://comptoir.reinvent-labs.com (labtest, Compose -p comptoir, Caddy hôte) |
| T11 | Envoyer les courriels d'intégration à une boîte autorisée et confirmer la réception réelle | QA | T05–T07 | Fait pour le bienvenue (reçu dans Gmail) ; facture vérifiée côté Resend (livrée, PDF joint) sur adresse de test |
| T12 | Modernisation visuelle et dynamique : système de surfaces (papier/verre/panneau marine), ombres et halos, animations d'entrée et au défilement, compteurs animés, graphiques maison, squelettes par route, barre de progression, palette ⌘K, recherche/tri/filtres instantanés | Interface | T08 | Fait (contrats e2e inchangés : libellés, `data-testid` et messages identiques ; `prefers-reduced-motion` respecté ; typecheck, lint, 41 unitaires et build au vert) |
| T13 | Espace plateforme `/admin` pour super-admins : vue d'ensemble multi-entreprises, suspension/réactivation d'entreprise, activation de compte, octroi/retrait du droit plateforme, fermeture de sessions, journal des envois et journal des actions | Backend + Interface | T03, T04 | Fait (migration `20261021120000_platform_admin` : `User.platformRole`, `Company.status`, `PlatformAuditLog` ; amorce par `PLATFORM_ADMIN_EMAILS` ; accès vérifié à chaque requête, non-admin redirigé, actions journalisées ; 12 tests unitaires sur les règles) |
| T14 | Rejouer la suite e2e complète et `scripts/verify.sh` sur une machine avec Docker, PostgreSQL `erp_e2e`, CLI `resend` et navigateurs Playwright | QA | T12, T13 | À faire (impossible dans l'environnement de développement actuel : ni Docker, ni navigateurs, ni base `erp_e2e`) |

Un seul agent modifie un fichier à la fois. Le pilote possède les documents et l'intégration ; les sous-agents annoncent les contrats API et les chemins qu'ils touchent avant d'éditer.
