# Version

## 2026-10-21

- Modernisation visuelle et interactive : système de surfaces (papier, verre, panneau marine à aurore), ombres et halos, animations d'entrée et au défilement, compteurs animés, graphiques maison (courbe, colonnes, anneau, sparkline), squelettes de chargement par route, barre de progression de navigation, palette de commandes ⌘K et recherche instantanée/tri/filtres dans les tableaux. `prefers-reduced-motion` neutralise tout le mouvement.
- Espace plateforme `/admin` réservé aux super-admins : vue d'ensemble multi-entreprises, entreprises (suspension/réactivation), comptes (activation, droit super-admin, fermeture de sessions), journal des envois et journal des actions tracé en base.
- Schéma : `User.platformRole`, `Company.status` et table `PlatformAuditLog` (migration `20261021120000_platform_admin`) ; amorce par `PLATFORM_ADMIN_EMAILS`.
- Contrats d'acceptation inchangés : mêmes libellés, mêmes `data-testid`, mêmes messages ; 41 tests unitaires (dont 12 sur les règles plateforme), typecheck, lint et build au vert.

## 2026-10-18

- Contrat technique fixé sur PostgreSQL, Prisma et Resend ; plan visuel ERP proposé à validation.

- Lot 1 construit : comptes, e-mails Resend journalisés et webhooks signés, tableau de bord, utilisateurs, produits, caisse, facture PDF. Compose prod vérifié en local.
