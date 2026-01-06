#!/usr/bin/env sh

set -e

PORT="${PORT:-8000}"
VAULT_CONTENT_PATH="${VAULT_CONTENT_PATH:-${VAULT_PATH:-/vault}}"
BUILD_ON_START="${BUILD_ON_START:-1}"

if [ "$BUILD_ON_START" = "1" ]; then
  echo "[viewer] Building Gatsby site from ${VAULT_CONTENT_PATH}" >&2
  npm run build
fi

echo "[viewer] Serving on 0.0.0.0:${PORT}" >&2
exec npx gatsby serve -H 0.0.0.0 -p "$PORT"
