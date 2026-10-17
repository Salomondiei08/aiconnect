# Déroulé du live : une application en 2 heures avec un agent IA

L'idée à faire passer : **l'agent ne décide pas quand c'est fini, les tests décident.** On écrit le contrat avant, on verrouille, on lance, et on regarde.

## Avant le live (15 min, hors antenne)

1. `brew install mailpit` (déjà fait) et `mailpit` lancé dans un terminal à part. Ouvrir http://localhost:8025 dans un onglet.
2. Resend : domaine vérifié, clé API prête, pour le vrai e-mail final (voir `.env.example`).
3. Dossier propre : `git status` vide, `scripts/lock.sh` déjà lancé (empreintes à jour).
4. Notifications coupées, police du terminal agrandie, `claude` connecté sur le meilleur modèle.

## Déroulé

| Temps | Ce qu'on fait | Ce qu'on montre |
|---|---|---|
| 0:00 | Le cahier des charges (28 pages) | Trop gros pour 2 h : on choisit le lot qui doit **marcher** |
| 0:08 | `docs/SPEC.md` | Le PDF réduit à un contrat : routes, libellés, messages exacts |
| 0:15 | `e2e/` | 7 fichiers, une vingtaine de scénarios, écrits **avant** le code. Les e-mails sont vérifiés pour de vrai dans Mailpit |
| 0:22 | `.claude/` | Hook Stop : impossible de s'arrêter si rouge. Hook PreToolUse : impossible de toucher aux tests |
| 0:25 | Lancement (prompt ci-dessous) | L'agent démarre, on commente |
| 0:45 | Point d'étape | Landing en ligne, premier test vert, commits qui tombent |
| 1:15 | Point d'étape | Inscription + e-mail de bienvenue dans Mailpit |
| 1:45 | Point d'étape | Utilisateurs, caisse, tableau de bord qui bouge |
| 1:50 | Démo finale | `scripts/verify.sh` tout vert, puis parcours à la main sur téléphone |
| 1:55 | Vrai e-mail | `.env.local` avec Resend, inscription avec ta propre adresse, l'e-mail arrive dans Gmail |

## Lancement

```bash
touch .claude/autopilot.on        # active les deux hooks
claude --permission-mode acceptEdits
```

Prompt à coller :

> Lis CLAUDE.md, docs/SPEC.md et docs/PLAN.md. Construis l'application en suivant PLAN.md dans l'ordre, sans me poser de question. Pour chaque tâche : lis son test e2e, implémente, lance le test ciblé, corrige jusqu'au vert, coche la case, commit. Tu n'as terminé que lorsque scripts/verify.sh est entièrement vert.

## Si ça coince

1. L'agent tourne en rond sur un test : `Échap`, puis lui dire « montre-moi la capture d'écran du test qui échoue et explique l'écart avec la SPEC ». Souvent un libellé.
2. Un test est vraiment faux (erreur de notre part) : `rm .claude/autopilot.on`, corriger le test, `scripts/lock.sh`, commit, `touch .claude/autopilot.on`. Le dire à l'antenne : c'est honnête et pédagogique.
3. Retard à 1:30 : lui demander de terminer l'étape en cours puis de sauter à l'étape 9. Les tests restants rouges montrent exactement ce qui manque.
4. Arrêt total : `rm .claude/autopilot.on`, l'agent peut s'arrêter. Le compteur plafonne de toute façon à 25 relances.

## Messages à faire passer

1. Un agent sans tests produit une démo. Un agent avec des tests produit un logiciel.
2. Le plus gros du travail humain, c'est le contrat : choisir le périmètre et écrire ce que « ça marche » veut dire.
3. Vérifier les e-mails, la sécurité (isolation entre entreprises, compte désactivé) et le mobile, pas seulement « la page s'affiche ».
