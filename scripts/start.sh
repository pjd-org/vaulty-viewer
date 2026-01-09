#!/usr/bin/env sh

set -e

PORT="${PORT:-4400}"
VAULT_CONTENT_PATH="${VAULT_CONTENT_PATH:-${VAULT_PATH:-/vault}}"
TASKER_API_URL="${TASKER_API_URL:-}"
# API_PROXY_URL: backend URL for nginx to proxy /api/ requests
# Default to localhost:4300 for same-pod deployments
API_PROXY_URL="${API_PROXY_URL:-http://127.0.0.1:4300}"

# Configure nginx to proxy API requests to the correct backend
NGINX_CONF="/etc/nginx/conf.d/default.conf"
NGINX_TEMPLATE="/etc/nginx/conf.d/default.conf.template"
if [ -f "$NGINX_TEMPLATE" ]; then
  echo "[viewer] Configuring nginx API proxy to ${API_PROXY_URL}" >&2
  sed "s|__API_PROXY_URL__|${API_PROXY_URL}|g" "$NGINX_TEMPLATE" > "$NGINX_CONF"
fi

# Runtime-injected config for the static app to read.
# The viewer app should fetch /config.json (or load it during bootstrap).
CONFIG_PATH="/usr/share/nginx/html/config.json"

echo "[viewer] Writing runtime config to ${CONFIG_PATH}" >&2
cat > "${CONFIG_PATH}" <<EOF
{
  "vaultContentPath": "${VAULT_CONTENT_PATH}",
  "apiUrl": "${TASKER_API_URL}",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Inject runtime config into index.html via a script tag
# This sets window.TASKER_API_URL for the React app to use
INDEX_PATH="/usr/share/nginx/html/index.html"
if [ -f "$INDEX_PATH" ] && [ -n "$TASKER_API_URL" ]; then
  echo "[viewer] Injecting TASKER_API_URL=${TASKER_API_URL} into index.html" >&2
  INJECT_SCRIPT="<script>window.TASKER_API_URL=\"${TASKER_API_URL}\";</script>"
  # Insert the script tag right after <head>
  sed -i "s|<head>|<head>${INJECT_SCRIPT}|" "$INDEX_PATH"
fi

# Nginx config is set at build time to listen on 4400. Skip patching.
echo "[viewer] Serving static site via nginx on 0.0.0.0:${PORT}" >&2
exec nginx -g 'daemon off;'
