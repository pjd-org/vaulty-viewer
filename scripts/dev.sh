#!/usr/bin/env sh

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MONOREPO_ROOT="$(cd "$APP_DIR/../.." && pwd)"

if [ -f "$MONOREPO_ROOT/pnpm-workspace.yaml" ] && [ -d "$MONOREPO_ROOT/apps/viewer" ]; then
  ROOT_DIR="$MONOREPO_ROOT"
else
  ROOT_DIR="$APP_DIR"
fi

load_env() {
  env_file="$1"
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck source=/dev/null
    . "$env_file"
    set +a
  fi
}

load_env "$ROOT_DIR/.env"
if [ "$ROOT_DIR" != "$APP_DIR" ]; then
  load_env "$APP_DIR/.env"
fi

resolve_path() {
  candidate="$1"

  if [ -z "$candidate" ]; then
    return 1
  fi

  case "$candidate" in
    "~"|"$HOME"|"$HOME/"*)
      candidate="${HOME}${candidate#~}"
      ;;
  esac

  if [ "${candidate#/}" = "$candidate" ]; then
    candidate="$ROOT_DIR/$candidate"
  fi

  echo "$candidate"
}

pick_path() {
  label="$1"
  value="$2"
  resolved="$(resolve_path "$value")" || return 1

  if [ -d "$resolved" ]; then
    VAULT_CONTENT_PATH="$resolved"
    VAULT_PATH_SOURCE="$label"
    return 0
  fi

  return 1
}

VAULT_PATH_SOURCE=""

pick_path "VAULT_CONTENT_PATH" "${VAULT_CONTENT_PATH:-}" \
  || pick_path "LOCAL_VAULT_PATH" "${LOCAL_VAULT_PATH:-}" \
  || pick_path "VAULT_PATH" "${VAULT_PATH:-}" \
  || VAULT_CONTENT_PATH="$(resolve_path "$APP_DIR/content")"

if [ ! -d "$VAULT_CONTENT_PATH" ]; then
  echo "[viewer] VAULT_CONTENT_PATH not found: $VAULT_CONTENT_PATH" >&2
  echo "[viewer] Set LOCAL_VAULT_PATH or VAULT_CONTENT_PATH in .env" >&2
else
  echo "[viewer] Using vault path (${VAULT_PATH_SOURCE:-default}): $VAULT_CONTENT_PATH" >&2
fi

PORT="${PORT:-${VIEWER_PORT:-8000}}"
API_PORT="${API_PORT:-4300}"
VAULT_API_URL="${VAULT_API_URL:-http://localhost:${API_PORT}}"

export VAULT_CONTENT_PATH
export VAULT_PATH="$VAULT_CONTENT_PATH"
export PORT
export VAULT_API_URL
export NODE_ENV=development

exec pnpm exec vinxi dev
