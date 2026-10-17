# Plan de test

## Automatisé

- Unitaires : validation d'entrées, jetons expirés/consommés, vérification de signature, déduplication webhook, politique de reprise, calcul de totaux.
- Intégration avec PostgreSQL réel en conteneur : migrations, transactions vente/stock, isolation entre deux entreprises, journal d'envoi et changements de statut webhook.
- E2E navigateur : inscription, connexion, récupération du mot de passe, ajout de produit, vente, reçu, pages mobile 360 px et absence de débordement.
- Tests provider mockés uniquement pour unités : réponse Resend valide, erreurs transitoires/permanentes, réponse sans ID, credentials invalides.
- Tests webhook : signature valide, invalide, corps altéré, événement répété, événement hors ordre.

## Intégration réelle Resend (avant de déclarer la livraison vérifiée)

1. Utiliser une adresse de test autorisée et un domaine d'envoi vérifié ; ne jamais viser des clients.
2. Envoyer un vrai courriel de bienvenue et un lien de récupération ; vérifier l'ID API, la ligne PostgreSQL, puis la réception en boîte si accessible.
3. Générer et envoyer une facture avec un PDF réel ; vérifier nom/type/taille de pièce jointe et réception.
4. Vérifier le webhook signé via l'endpoint public de test ou un forwarder local, puis contrôler les statuts delivered/bounced/failed en base.
5. Tenter une clé invalide et une erreur fournisseur ; vérifier message d'erreur sûr et absence de faux statut « livré ».
6. Redémarrer les conteneurs et confirmer la persistance PostgreSQL.

Rapporter séparément les résultats automatisés, l'acceptation Resend et la réception réelle en boîte. Ne jamais déduire la livraison de la seule réponse API.
