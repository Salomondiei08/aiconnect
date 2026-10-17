# DESIGN — proposition à valider avant l'interface

## Référence

Examen local de Reinvent Labs Academy : structure sobre, titres Poppins affirmés, grande zone d'introduction bleu marine, accents sarcelle, surfaces pierre claire, interactions discrètes et bonne hiérarchie mobile. Pour cet ERP, conserver la clarté, le contraste et le traitement éditorial ; créer une identité propre au produit, sans reprendre son logo ni ses couleurs à l'identique.

## Tokens proposés

- Encre ardoise `#203247` — navigation et texte principal.
- Bleu pétrole `#176B72` — actions et états actifs.
- Craie `#F5F4EF` — fond clair.
- Papier `#FFFFFF` — surfaces et formulaires.
- Ocre comptable `#C88736` — accent ponctuel pour alertes et chiffres à examiner.
- Rouge erreur `#A83A36` — erreurs uniquement.

Typographie proposée : **DM Sans** pour interface et chiffres, **Manrope** pour les titres. Échelle : 12, 14, 16, 20, 28, 36 px ; corps 16 px, interligne 1.5.

## Mise en page

Accueil public : texte aligné à gauche, introduction éditoriale concise, aperçu réel du tableau de bord comme visuel principal. Application : barre latérale compacte sur ordinateur, navigation basse ou tiroir sur mobile, contenu en une colonne jusqu'à 768 px et grilles fluides au-delà. Tableaux deviennent des lignes/cartes lisibles au téléphone. Cibles tactiles de 44 px minimum.

```text
Desktop:  [navigation] [titre + période] [KPI en rangée]
                         [ventes / activité] [stock bas]
Mobile:   [barre haute]
          [titre] [KPI]
          [ventes] [stock]
          [navigation basse]
```

## Principes

Utiliser la vente et le stock comme langage visuel : totaux lisibles, unités explicites, états vides qui guident vers l'action. Une seule zone de marque forte ; pas de décor gratuit. Définir clair et sombre en variables CSS, ajouter un bouton unique de bascule de thème et vérifier le contraste WCAG AA avant livraison. Respecter `prefers-reduced-motion`, focus clavier, erreurs proches du champ et confirmations explicites.

**Statut : proposition, pas encore validée.** N'implémenter aucun écran stylé avant accord sur les tokens ; les documents techniques et le socle peuvent avancer indépendamment.
