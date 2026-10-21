# DESIGN : Comptoir

**Statut : appliqué.** Identité inspirée de Reinvent Labs Academy à la demande du porteur du projet (même famille visuelle « Plateau »), avec un accent propre à l'ERP. Depuis le 2026-10-21, la couche « modernisation » (verre, dégradés, animations, graphiques) s'ajoute à cette base sans changer un seul libellé ni `data-testid`.

## Tokens (variables CSS dans `src/app/globals.css`)

| Rôle | Clair | Sombre |
|---|---|---|
| Encre marine, texte et structure (`--ink`, `--brand`, `--panel`) | `#14213A` | `#ECEEF2` / panneau `#1B2740` |
| Pierre claire, fond (`--paper`) | `#F3F2EE` | `#121620` |
| Surface des cartes et formulaires (`--surface`) | `#FFFFFF` | `#1B2130` |
| Sarcelle, actions et états actifs (`--spark`, `--spark-fill`) | `#0B5754` / `#0E6F69` | `#7FD1C6` / `#3FB3A6` |
| Ocre comptable, stock bas et montants à surveiller (`--ochre`) | `#8A5A14` sur `#F5E7CF` | `#E8B766` sur `#36291A` |
| Rouge, erreurs uniquement (`--danger`) | `#B3261E` | `#F2948C` |

S'y ajoutent : `--surface-2`/`--sunken` (plans en retrait), `--line` (filets), `--moss` (succès), `--chart-1..5` (séries de graphiques), et quatre ombres `--shadow-xs|sm|md|lg` plus un halo `--shadow-glow` sarcelle réservé aux appels à l'action.

Typographie : **Poppins** (fichiers locaux, `next/font/local`) pour l'interface et les titres. Échelle : 12, 14, 16, 20, 28 px, titres d'accueil en `clamp(2.2rem, 6vw, 4rem)`, titres de page en `1.75rem` avec `tracking-[-0.02em]`. Chiffres tabulaires (`.tabular`) dans les montants et tableaux.

## Surfaces et profondeur

1. **Papier** : cartes et tableaux en `--surface` sur fond `--paper`, filet `--line`, coins de 1 à 1,25 rem, ombre `--shadow-xs` au repos.
2. **Verre** (`.glass`, `.glass-paper`) : barre haute, tiroir mobile, palette de commandes et panneaux flottants — fond translucide, flou d'arrière-plan, filet clair en haut.
3. **Panneau marine** (`--panel`) : une seule zone de marque forte par écran — accueil, écrans d'authentification (volet gauche) et barre latérale de l'espace plateforme. Il reçoit une aurore animée (`.aurora`) et une trame (`.grid-lines`), toutes deux désactivées en mouvement réduit.
4. **Relief au survol** (`.card-lift`, variante `interactive` de `Card`) : translation de 2 px et ombre `--shadow-md` ; jamais de changement de texte ni de déplacement de mise en page.

## Mouvement et micro-interactions

- Entrées : `animate-fade-up`, `animate-fade-down`, `animate-scale-in`, et `Reveal` (apparition au défilement via `IntersectionObserver`, décalage progressif `delay`).
- Chiffres : `AnimatedNumber` / `AnimatedXof` comptent jusqu'à la cible en ~700 ms ; **le texte final est exactement la valeur**, ce que lisent les tests d'acceptation.
- Graphiques : courbe tracée (`draw-line`), barres qui poussent (`grow-width`), anneau qui se dessine (`donut-draw`), halos `pulse-ring` sur les pastilles « en direct ».
- Retours d'action : barre de progression de navigation (`RouteProgress`), squelettes `.skeleton` + `loading.tsx` par route, `toast` de confirmation, pression `active:scale-[0.98]` sur les boutons.
- `prefers-reduced-motion` : toutes les animations sont neutralisées par une règle globale, `Reveal` affiche son contenu immédiatement, les compteurs et le thème suivent la valeur cible sans transition.

## Graphiques et données

Composants maison en `src/components/charts/` (aucune dépendance de plus) : `AreaChart` (ventes et inscriptions), `ColumnChart` et `BarList` (classements), `DonutChart` (répartition des envois), `Sparkline` (tendance compacte). Couleurs lues dans `--chart-1..5`, valeurs formatées par `formatValue` (`xof`, `xofShort`, `count`, `compact`) — aucune fonction n'est passée du serveur vers un composant client. Les graphiques sont décoratifs (`aria-hidden`) : chaque chiffre existe aussi en texte dans la page.

## Espace plateforme (`/admin`)

Même système, contexte distinct : barre latérale marine permanente avec pastille sarcelle sur la section active, badge « Espace plateforme » et bandeau de titre « Administration de la plateforme », pour qu'on sache toujours qu'on agit au-dessus des entreprises. Tableaux avec recherche instantanée, filtres par pastilles, tri par colonne et pagination ; les actions sensibles (suspension, désactivation, droit super-admin, fermeture de sessions) sont des boutons explicites accompagnés d'un message de confirmation.

## Mise en page

1. Accueil : en-tête collant translucide, grand panneau marine aux coins de 2 rem avec la promesse et un aperçu du tableau de bord, puis quatre cartes de fonctions.
2. Application : barre latérale de 16 rem sur ordinateur (marque, entreprise avec pastille verte, navigation, identité, déconnexion), barre haute avec recherche rapide (⌘K) et tiroir sur mobile.
3. Authentification : volet marine à gauche (masqué sous `lg`) et carte de formulaire à droite, avec bascule de thème.
4. Tableaux dans un conteneur à défilement horizontal propre : jamais de débordement de page à 360 px.
5. Boutons en pilule, cibles de 44 px minimum, focus visible, `prefers-reduced-motion` respecté.

## Principes

La vente et le stock sont le langage visuel : totaux lisibles, unités explicites (FCFA), états vides qui mènent à l'action. Une seule zone de marque forte (le panneau marine). Clair par défaut, sombre conçu et non inversé, bascule par un bouton unique dont le nom accessible contient « thème ». Le mouvement sert la lecture (hiérarchie, continuité, confirmation) et jamais la décoration seule : rien ne bouge qui ne soit déjà compris.
