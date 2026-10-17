#!/usr/bin/env bash
# Enregistre l'empreinte des fichiers de test. À relancer uniquement par un humain après avoir modifié un test.
set -euo pipefail
cd "$(dirname "$0")/.."
shasum -a 256 e2e/*.ts playwright.config.ts scripts/verify.sh > .claude/locked.sha256
echo "Verrou mis à jour : $(wc -l < .claude/locked.sha256 | tr -d ' ') fichiers"
