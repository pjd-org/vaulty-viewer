#!/usr/bin/env sh

set -e

PORT="${PORT:-4400}"
VAULT_CONTENT_PATH="${VAULT_CONTENT_PATH:-${VAULT_PATH:-/vault}}"

# Runtime-injected config for the static app to read.
# The viewer app should fetch /config.json (or load it during bootstrap).
CONFIG_PATH="/usr/share/nginx/html/config.json"

echo "[viewer] Writing runtime config to ${CONFIG_PATH}" >&2
cat > "${CONFIG_PATH}" <<EOF
{
  "vaultContentPath": "${VAULT_CONTENT_PATH}",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Nginx config is set at build time to listen on 4400. Skip patching.
echo "[viewer] Serving static site via nginx on 0.0.0.0:${PORT}" >&2
exec nginx -g 'daemon off;'
