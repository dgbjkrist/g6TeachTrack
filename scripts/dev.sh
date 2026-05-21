#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules/concurrently ]]; then
  echo "→ Installation des dépendances du monorepo…"
  npm install
fi

if [[ ! -d univirtuelle/node_modules ]] || [[ ! -d backend-pct/node_modules ]]; then
  echo "→ Vérification des workspaces (univirtuelle, backend-pct)…"
  npm install
fi

echo "→ Démarrage API (http://localhost:3000) + frontend (http://localhost:8080)"
echo "  Ctrl+C pour tout arrêter."
exec npm run dev
