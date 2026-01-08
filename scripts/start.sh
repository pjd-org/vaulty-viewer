#!/usr/bin/env sh

set -e

PORT="${PORT:-8000}"
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

# Ensure nginx listens on the desired PORT. default.conf listens on 8000; if PORT differs, patch it.
if [ "${PORT}" != "8000" ]; then
  echo "[viewer] Patching nginx listen port to ${PORT}" >&2
  sed -i "s/listen 8000;/listen ${PORT};/" /etc/nginx/conf.d/default.conf
fi

echo "[viewer] Serving static site via nginx on 0.0.0.0:${PORT}" >&2
exec nginx -g 'daemon off;'
