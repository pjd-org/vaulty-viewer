#!/usr/bin/env sh
# start.sh — Viewer container entrypoint.
#
# By default the Gatsby site is built at IMAGE BUILD TIME (see Dockerfile).
# This script only serves the pre-built artefacts.
#
# Escape hatch: set BUILD_ON_START=1 to force a rebuild at container start
# (e.g. local dev with a live vault mount).  This is expensive and should
# NOT be used in production — it increases cold-start time by several minutes
# and can cause OOM kills in constrained environments.
#
# Environment variables:
#   BUILD_ON_START          1 = rebuild at start; 0 = serve pre-built (default: 0)
#   PORT                    TCP port for gatsby serve (default: 8000)
#   VAULT_CONTENT_PATH      Path gatsby-source-filesystem reads vault content from
#                           (default: $VAULT_PATH, then /vault)

set -e

PORT="${PORT:-8000}"
VAULT_CONTENT_PATH="${VAULT_CONTENT_PATH:-${VAULT_PATH:-/vault}}"
BUILD_ON_START="${BUILD_ON_START:-0}"

if [ "$BUILD_ON_START" = "1" ]; then
  echo "[viewer] WARNING: BUILD_ON_START=1 — rebuilding Gatsby site at container start." >&2
  echo "[viewer] This is an escape hatch for dev use only. Use the pre-built image in production." >&2
  echo "[viewer] Vault content path: ${VAULT_CONTENT_PATH}" >&2
  VAULT_CONTENT_PATH="$VAULT_CONTENT_PATH" npx gatsby build
else
  echo "[viewer] BUILD_ON_START=0 — serving pre-built artefacts." >&2
  if [ ! -d "/app/public" ] || [ -z "$(ls -A /app/public 2>/dev/null)" ]; then
    echo "[viewer] ERROR: /app/public is empty or missing. Was the image built correctly?" >&2
    echo "[viewer] Set BUILD_ON_START=1 to force a build at container start (not recommended for production)." >&2
    exit 1
  fi
fi

echo "[viewer] Serving on 0.0.0.0:${PORT}" >&2
exec npx gatsby serve -H 0.0.0.0 -p "$PORT"
