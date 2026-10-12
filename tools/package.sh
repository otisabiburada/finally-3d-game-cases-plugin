#!/usr/bin/env bash
# Makes the release zip that users install: one folder with everything Decky needs, no build step.
set -euo pipefail
cd "$(dirname "$0")/.."
VER=$(node -p "require('./package.json').version")
OUT="release"; DIR="$OUT/3d-game-cases"
rm -rf "$OUT"; mkdir -p "$DIR/dist"
cp plugin.json package.json main.py LICENSE README.md "$DIR/"
cp dist/index.js dist/inject.js "$DIR/dist/"
( cd "$OUT" && zip -qr "Finally-3D-Game-Cases-v$VER.zip" 3d-game-cases )
echo "$OUT/Finally-3D-Game-Cases-v$VER.zip"
