# Tâches

| ID | Tâche | Responsable | Dépendances | Statut |
|---|---|---|---|---|
| T01 | Remplacer les références SQLite/SMTP/Mailpit dans les contrats, configuration et harnais de test par PostgreSQL/Prisma/Resend | Pilote | — | En cours |
| T02 | Créer Compose Next.js + PostgreSQL + Caddy, healthchecks et volume persistant | Backend | T01 | À faire |
| T03 | Modèle Prisma, migrations et isolation entreprise | Backend | T02 | À faire |
| T04 | Auth, inscription, vérification et récupération sécurisée | Backend | T03 | À faire |
| T05 | Module serveur Resend, gabarits React Email et journal des envois | Backend | T03 | À faire |
| T06 | Webhook signé, idempotence et reprises bornées | Backend | T05 | À faire |
| T07 | Produits, caisse, stock atomique, reçu PDF et courriel de facture | Backend | T03,T05 | À faire |
| T08 | Interface responsive après validation DESIGN.md | Interface | T01 | Bloqué par validation visuelle |
| T09 | Tests unitaires, PostgreSQL d'intégration, e2e et boîte Resend autorisée | QA | T02–T08 | À faire |
| T10 | Déploiement self-hosted et vérification domaine/Resend via skill | Pilote | T09 | À faire, demande de déploiement requise |
| T11 | Envoyer les courriels d'intégration à une boîte autorisée et confirmer la réception réelle | QA | T05–T07 | À faire |

Un seul agent modifie un fichier à la fois. Le pilote possède les documents et l'intégration ; les sous-agents annoncent les contrats API et les chemins qu'ils touchent avant d'éditer.
