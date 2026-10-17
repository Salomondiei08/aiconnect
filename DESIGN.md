# DESIGN : Comptoir

**Statut : appliqué.** Identité inspirée de Reinvent Labs Academy à la demande du porteur du projet (même famille visuelle « Plateau »), avec un accent propre à l'ERP.

## Tokens (variables CSS dans `src/app/globals.css`)

| Rôle | Clair | Sombre |
|---|---|---|
| Encre marine, texte et structure (`--ink`, `--brand`, `--panel`) | `#14213A` | `#ECEEF2` / panneau `#1B2740` |
| Pierre claire, fond (`--paper`) | `#F3F2EE` | `#121620` |
| Surface des cartes et formulaires (`--surface`) | `#FFFFFF` | `#1B2130` |
| Sarcelle, actions et états actifs (`--spark`, `--spark-fill`) | `#0B5754` / `#0E6F69` | `#7FD1C6` / `#3FB3A6` |
| Ocre comptable, stock bas et montants à surveiller (`--ochre`) | `#8A5A14` sur `#F5E7CF` | `#E8B766` sur `#36291A` |
| Rouge, erreurs uniquement (`--danger`) | `#B3261E` | `#F2948C` |

Typographie : **Poppins** (fichiers locaux, `next/font/local`) pour l'interface et les titres. Échelle : 12, 14, 16, 20, 28 px, titres d'accueil en `clamp(2.2rem, 6vw, 4rem)`. Chiffres tabulaires (`.tabular`) dans les montants et tableaux.

## Mise en page

1. Accueil : en-tête collant translucide, grand panneau marine aux coins de 2 rem avec la promesse et un aperçu du tableau de bord, puis quatre cartes de fonctions.
2. Application : barre latérale de 16 rem sur ordinateur (marque, entreprise avec pastille verte, navigation, identité, déconnexion), barre haute avec tiroir sur mobile.
3. Tableaux dans un conteneur à défilement horizontal propre : jamais de débordement de page à 360 px.
4. Boutons en pilule, cibles de 44 px minimum, focus visible, `prefers-reduced-motion` respecté.

## Principes

La vente et le stock sont le langage visuel : totaux lisibles, unités explicites (FCFA), états vides qui mènent à l'action. Une seule zone de marque forte (le panneau marine). Clair par défaut, sombre conçu et non inversé, bascule par un bouton unique.
