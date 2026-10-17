# Déroulé du live : construire et vérifier un MVP ERP

## Avant le live

- Vérifier Docker, le domaine d'envoi Resend vérifié et la clé dans `.env.local` uniquement.
- Choisir une boîte de test contrôlée ; ne jamais envoyer à un client.
- Lire les contrats racine ; obtenir la validation des tokens de `DESIGN.md` avant de construire les écrans.
- Ne pas activer une boucle autonome qui ignore les tâches bloquées ou la validation design.

## Déroulé en deux heures

| Temps | Étape | Preuve à montrer |
|---|---|---|
| 0–10 min | Réduire le cahier de 28 pages au parcours métier du PRD | Critères d'acceptation |
| 10–20 min | Attribuer backend, interface et QA | Fichiers et contrats séparés dans TASKS.md |
| 20–40 min | Docker Compose, PostgreSQL, Prisma et migrations | Santé DB et données persistées |
| 40–75 min | Auth, produit, vente et décrément atomique | Parcours navigateur + vérification PostgreSQL |
| 75–95 min | Resend, gabarits et reçu PDF | ID Resend, journal DB et réception si disponible |
| 95–110 min | Webhook signé, déduplication et échecs | Statuts provider vérifiés, pas supposés |
| 110–120 min | Redémarrage et parcours complet | Stock/ventes conservés, tests rapportés |

Une vraie mise en production ERP complète ne tient pas en deux heures. Le live livre un MVP borné dont les fonctions démontrées ont été vérifiées.
