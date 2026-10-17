# SPEC : ERP, premier lot (contrat de l'agent)

Source : `Cahier des charges — Application web de gestion d'entreprise (ERP)` (EMYTEC, 28 pages).
Ce document réduit le cahier des charges à ce qui doit **marcher** dans ce premier lot. Les tests `e2e/` vérifient chaque point ci-dessous. Les libellés entre guillemets sont des contrats : les tests les cherchent tels quels (casse et astérisque `*` final tolérés, apostrophe droite ou typographique tolérée).

## 1. Règles générales

1. Toute l'interface est en français. Montants en XOF, sans décimales, format `fr-FR` (exemple : `3 000 FCFA`).
2. Chaque `<input>`, `<select>` ou combobox a un `<label>` relié (`htmlFor`/`id`). Les icônes d'aide « i » sont **hors** du `<label>`.
3. Formulaires multi-étapes : une seule étape présente dans le DOM à la fois.
4. Multi-entreprise : chaque table métier porte `company_id`. Toute lecture/écriture est filtrée côté serveur par l'entreprise de la session. Jamais de confiance dans un `company_id` envoyé par le client.
5. Pages protégées : sans session, redirection vers `/connexion`.
6. Thème : `next-themes` avec `attribute="class"`. Un **bouton unique** dont le nom accessible contient « thème » bascule clair/sombre (pas de menu déroulant).
7. Mobile d'abord : aucune page ne déborde horizontalement à 360 px.

## 2. Routes

| Route | Contenu |
|---|---|
| `/` | Page d'accueil publique |
| `/inscription` | Inscription en 3 étapes |
| `/connexion` | Connexion |
| `/mot-de-passe-oublie` | Demande de lien de réinitialisation |
| `/reinitialiser` | Choix du nouveau mot de passe (le jeton vient du lien de l'e-mail) |
| `/tableau-de-bord` | Accueil après connexion |
| `/utilisateurs` | Liste des utilisateurs |
| `/utilisateurs/nouveau` | « Ajouter un utilisateur » |
| `/produits` | Liste et ajout de produits |
| `/ventes/nouvelle` | Caisse (point de vente) |

## 3. Page d'accueil (`/`)

1. En haut : « S'inscrire » et « Se connecter » (liens ou boutons).
2. Au centre : « Commencer gratuitement » mène à `/inscription`.
3. Texte : « Gérez tout votre commerce depuis une seule application : stock, ventes, factures, achats, comptabilité et paie. Pour une boutique ou pour plusieurs points de vente, à petit prix, et gratuit pour démarrer. »
4. Bouton de thème (voir 1.6).

## 4. Inscription (`/inscription`)

Boutons de navigation : « Suivant », « Précédent », puis « S'inscrire » à la dernière étape.

**Étape 1, détails de l'entreprise** : « Nom de l'entreprise »*, « Devise »* (défaut `XOF`), « Pays »* (défaut `Côte d'Ivoire`), « Commune »*, « Ville »*, « Code postal »* (aide : « 00000 » si pas de code), « Point de repère »*, « Fuseau horaire »* (défaut `Africa/Abidjan`). Facultatifs : « Date de début », « Site Internet », « Numéro de contact professionnel ».

**Étape 2, paramètres** : « Mois de début d'année financière »* (défaut Janvier), « Méthode comptable »* (défaut FIFO). Facultatifs : « Nom de taxe 1 », « N° de taxe 1 ».

**Étape 3, propriétaire** : « Prénom »*, « Nom », « Nom d'utilisateur »*, « E-mail »*, « Mot de passe »*, « Confirmation du mot de passe »*.

Règles :
1. Mot de passe (RG3) : au moins 8 caractères, une majuscule, un chiffre, un caractère spécial. Message : « Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial ».
2. Confirmation différente : « Les mots de passe doivent être identiques ».
3. Nom d'utilisateur ou e-mail déjà pris : « Ce nom d'utilisateur est déjà utilisé » / « Cet e-mail est déjà utilisé ».
4. Succès : création de l'entreprise, d'un emplacement par défaut « Boutique principale » (code `BL0001`), du compte propriétaire avec le rôle Admin, ouverture de session, redirection vers `/tableau-de-bord`.
5. Un e-mail dont le sujet contient « Bienvenue » est envoyé au propriétaire, avec son prénom dans le corps.

## 5. Connexion et mot de passe

1. `/connexion` : « Nom d'utilisateur », « Mot de passe », bouton « Se connecter », lien « Mot de passe oublié ? ».
2. Mauvais identifiants : « Nom d'utilisateur ou mot de passe incorrect ».
3. Compte inactif (`is_active = false`) ou sans droit de connexion : « Ce compte est désactivé ». Aucune session créée.
4. `/mot-de-passe-oublie` : « E-mail », bouton « Envoyer le lien ». Réponse identique que l'adresse existe ou non : « Si un compte existe avec cette adresse, un e-mail a été envoyé. »
5. E-mail envoyé : sujet contenant « Réinitialisation », partie texte contenant le lien complet (`APP_URL` + chemin contenant `reinitialiser` ou `reset-password` et le jeton).
6. Page du lien : « Nouveau mot de passe », « Confirmation du mot de passe », bouton « Enregistrer ». Succès : redirection vers `/connexion` avec « Mot de passe modifié ». L'ancien mot de passe ne marche plus.

## 6. Tableau de bord (`/tableau-de-bord`)

1. Titre : « Bienvenue, {prénom} ».
2. Menu latéral (desktop) avec liens directs : « Tableau de bord », « Utilisateurs », « Produits », « Nouvelle vente ». Bouton « Se déconnecter ».
3. Mobile : bouton dont le nom accessible contient « menu » qui ouvre ces mêmes liens.
4. Cartes KPI avec `data-testid` : `kpi-total-ventes`, `kpi-factures-impayees`, `kpi-total-achats`, `kpi-total-depenses`, `kpi-net`. Chaque carte contient son libellé et un montant. Aucun autre chiffre dans la carte.
5. Sans vente : toutes les cartes à 0, message « Aucune vente pour l'instant » et bouton « Nouvelle vente ».
6. Le propriétaire voit toutes les boutiques ; un caissier ne voit que ses propres ventes.

## 7. Utilisateurs

**Liste `/utilisateurs`** : titre « Utilisateurs », bouton « Ajouter », champ « Rechercher » (filtre instantané, insensible à la casse, sur toutes les colonnes), tableau `<table>` avec colonnes Nom d'utilisateur, Nom, Rôle, E-mail, Action. Actions par ligne : « Modifier », « Voir », « Effacer ». « Effacer » est **désactivé** (`disabled`) sur la ligne de l'utilisateur connecté (RG4).

**Formulaire `/utilisateurs/nouveau`** (titre « Ajouter un utilisateur ») :
1. Bloc 1 : « Préfixe », « Prénom »*, « Nom de famille », « E-mail »*, case « Est actif » (cochée par défaut).
2. Bloc 2 : case « Autoriser la connexion » (cochée), « Nom d'utilisateur », « Mot de passe », « Confirmez le mot de passe », « Rôle »* parmi `Admin`, `Gérant`, `Caissier`, `Comptable`, `RH`.
3. Bloc 3 : case « Tous les emplacements » (cochée par défaut).
4. Bouton « Sauvegarder ». Erreurs affichées sous les champs, données conservées. Mêmes messages qu'à l'inscription (RG1, RG3).
5. Succès : « Utilisateur ajouté avec succès », retour à `/utilisateurs`.
6. Le nom d'utilisateur est unique dans toute l'application (pas de suffixe d'entreprise dans cette version). Vide : généré depuis le prénom (RG2).

## 8. Produits (`/produits`)

1. Bouton « Ajouter un produit » : « Nom du produit »*, « Prix d'achat »*, « Prix de vente »*, « Quantité initiale »*, « Stock minimum ». Bouton « Sauvegarder ».
2. Tableau : une ligne par produit, la cellule de stock porte `data-testid="stock-qty"`.

## 9. Caisse (`/ventes/nouvelle`)

1. Champ « Rechercher un produit » (label ou `aria-label`).
2. Chaque produit est une tuile cliquable `data-testid="product-tile"` contenant son nom. Un clic ajoute 1 au panier.
3. Total du panier : `data-testid="cart-total"`.
4. Bouton « Encaisser » ouvre le paiement, mode « Espèces » par défaut, bouton « Valider le paiement ».
5. Succès : « Vente enregistrée », stock décrémenté, vente rattachée à l'emplacement et à l'utilisateur, KPI « Total des ventes » mis à jour.

## 10. Modèle de données minimal

1. `companies` : nom, devise, pays, commune, ville, code postal, point de repère, fuseau, mois de début d'exercice, méthode comptable, taxes.
2. `locations` : `company_id`, nom, code.
3. Utilisateurs (table Better Auth étendue) : `company_id`, `username`, `prefix`, `first_name`, `last_name`, `role`, `is_active`, `can_login`, `all_locations`.
4. `products` : `company_id`, nom, prix d'achat, prix de vente, stock, stock minimum (entiers XOF).
5. `sales` et `sale_items` : `company_id`, `location_id`, `user_id`, total, mode de paiement, date.

## 11. Technique

Les choix techniques sont définis par les documents à la racine `ARCHITECTURE.md` et `AGENTS.md`, qui prévalent sur les anciennes notes de ce dossier. Pile obligatoire : Next.js, PostgreSQL, Prisma et Resend exclusivement ; React Email pour les gabarits. Interdits : SQLite, Drizzle, Nodemailer, SMTP, Mailpit et autres fournisseurs transactionnels. Les exigences d'envoi, journalisation, webhooks signés/idempotents, reprises, PDF, Docker Compose et déploiement self-hosted sont définies dans `PRD.md`, `ARCHITECTURE.md` et `TEST_PLAN.md`.

## Hors périmètre de ce lot

Comptabilité SYSCOHADA, fiscalité, paie, achats fournisseurs, Mobile Money, mode hors ligne, modules optionnels (réparation, réservations, restauration).
