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

ENV_FILE="$ROOT/backend-pct/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "→ Fichier backend-pct/.env introuvable — copie depuis .env.example"
  cp "$ROOT/backend-pct/.env.example" "$ENV_FILE"
  echo ""
  echo "  Éditez backend-pct/.env et renseignez au minimum DATABASE_URL et JWT_SECRET,"
  echo "  puis relancez : ./scripts/dev.sh"
  echo ""
  exit 1
fi

db_url="$(
  grep -E '^[[:space:]]*DATABASE_URL=' "$ENV_FILE" \
    | grep -v '^[[:space:]]*#' \
    | tail -1 \
    | sed -E 's/^[[:space:]]*DATABASE_URL=//; s/^["'\'']|["'\'']$//g' \
    | tr -d '[:space:]'
)"
if [[ -z "$db_url" ]] || [[ "$db_url" == *"votre_hote"* ]] || [[ "$db_url" == *"utilisateur:motdepasse"* ]]; then
  echo "ERREUR: DATABASE_URL active manquante ou encore au format exemple dans backend-pct/.env"
  echo "  Décommentez et renseignez une ligne DATABASE_URL=postgresql://..."
  exit 1
fi

echo "→ Démarrage API (http://localhost:3000) + frontend (http://localhost:8080)"
echo "  Ctrl+C pour tout arrêter."
exec npm run dev
