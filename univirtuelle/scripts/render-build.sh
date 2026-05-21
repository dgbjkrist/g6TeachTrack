#!/usr/bin/env bash
# Build fiable sur Render (Linux) : optional deps Rollup + Node 20
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Node: $(node -v)"
echo "Platform: $(uname -s)/$(uname -m)"

npm ci --include=optional

if [ "$(uname -s)" = "Linux" ] && ! node -e "require('@rollup/rollup-linux-x64-gnu')" 2>/dev/null; then
  echo "→ Installation explicite @rollup/rollup-linux-x64-gnu…"
  npm install "@rollup/rollup-linux-x64-gnu@4.24.0" --no-save --force
fi

npm run build

echo "→ Build OK ($(du -sh dist 2>/dev/null | cut -f1))"
