#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/scripts/migrate-monorepo.log"

exec > >(tee -a "$LOG") 2>&1

echo "=== Migration monorepo (git subtree) — $(date) ==="

if [[ ! -d backend-pct-src ]] || [[ ! -d univirtuelle-src ]]; then
  echo "ERREUR: backend-pct-src et univirtuelle-src doivent exister."
  exit 1
fi

if [[ -d backend-pct ]] || [[ -d univirtuelle ]]; then
  echo "ERREUR: backend-pct/ ou univirtuelle/ existent déjà. Migration déjà faite?"
  exit 1
fi

# Réinitialiser un dépôt incomplet
if [[ -d .git ]] && [[ ! -f .git/HEAD ]]; then
  echo "→ Suppression d'un .git incomplet…"
  rm -rf .git
fi

if [[ ! -d .git ]]; then
  echo "→ git init…"
  git init -b main
fi

echo "→ git subtree add backend-pct…"
git subtree add --prefix=backend-pct backend-pct-src main

echo "→ git subtree add univirtuelle…"
git subtree add --prefix=univirtuelle univirtuelle-src main

echo "→ Ajout des fichiers racine monorepo…"
git add package.json package-lock.json README.md .gitignore scripts/
git commit -m "$(cat <<'EOF'
chore: configuration monorepo (workspaces npm + script dev)

EOF
)" || echo "(commit racine ignoré si rien de nouveau)"

echo "→ Nettoyage des clones sources…"
rm -rf backend-pct-src univirtuelle-src

echo "=== Terminé ==="
git log --oneline -8
echo "Branches:"
git branch -a
