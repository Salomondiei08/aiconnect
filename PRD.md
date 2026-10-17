# PRD — ERP commercial, premier lot

## But

Permettre à un commerçant ivoirien de gérer une boutique et de réaliser une première vente rapidement depuis un téléphone ou un ordinateur. Le cahier des charges EMYTEC complet (28 pages) reste la vision produit ; ce lot livre un parcours commercial vertical, vérifiable.

## Utilisateurs et parcours

- Propriétaire : crée son entreprise et son compte, gère les produits, consulte ventes et stock.
- Caissier : se connecte et enregistre une vente pour sa boutique.
- Parcours d'acceptation : inscription → connexion → créer un produit → vendre → stock décrémenté → reçu PDF → courriel reçu.

## Fonctionnalités du lot

1. Inscription entreprise et propriétaire, connexion, vérification d'adresse e-mail si activée, récupération et changement de mot de passe.
2. Une boutique par entreprise pour ce lot ; isolation stricte des données entre entreprises.
3. Création et consultation de produits (nom, prix achat/vente, quantité, seuil d'alerte).
4. Caisse espèces, vente persistée dans PostgreSQL et décrément atomique du stock ; interdiction du stock négatif.
5. Reçu consultable et imprimable ; courriel de facture avec véritable pièce PDF jointe.
6. Tableau de bord simple avec ventes, produits et état vide.
7. Courriels transactionnels Resend : bienvenue, vérification si activée, réinitialisation sécurisée, confirmation de changement de mot de passe, facture.
8. Journal des livraisons en base et suivi webhook signé : envoyé, livré, rejeté, échoué. L'acceptation de l'API Resend n'est pas une preuve de livraison.

## Critères d'acceptation

- Inscription et connexion marchent avec des identifiants persistés ; les mots de passe sont hachés.
- Les jetons de récupération sont hachés en base, à usage unique et expirent.
- Une vente réussie et son mouvement de stock sont enregistrés dans une transaction Prisma ; une vente invalide ne change aucune donnée.
- Un compte d'une entreprise ne peut lire ni modifier les données d'une autre entreprise, même en forgeant un identifiant.
- L'envoi retourne et persiste l'identifiant Resend ; les événements webhook sont vérifiés cryptographiquement et dédupliqués.
- Les échecs transitoires sont réessayés sans créer de doublon de message ; les erreurs permanentes sont visibles et explicites.
- Au moins un test d'intégration réel envoie un courriel avec Resend à une boîte de test autorisée et confirme sa réception si disponible.
- Le parcours principal fonctionne après redémarrage des conteneurs, avec données PostgreSQL préservées.
- Les vues sont utilisables à 320–480 px, cibles tactiles ≥44 px, sans défilement horizontal.

## Hors lot

Comptabilité SYSCOHADA, déclarations fiscales et paie fiables, achats avancés, transferts multi-boutiques, fonctionnement hors ligne, SMS/WhatsApp, abonnements, Mobile Money et intégrations fiscales. Ne pas présenter ces fonctions comme opérationnelles.

## Hypothèses à confirmer avant production

Pays de lancement : Côte d'Ivoire ; devise : XOF ; expéditeur Resend sur un sous-domaine vérifié ; un destinataire de test autorisé ; mentions légales et règles de conservation à valider.
