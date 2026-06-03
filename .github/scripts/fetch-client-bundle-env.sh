#!/usr/bin/env bash
# Fetch EXPO_PUBLIC_* / VITE_* bundle keys from AWS Secrets Manager for ci_web Docker build.
# Same secret ids as Server/scripts/secrets.sh / Server/.env.example (# From secret: lines).
# Non-fatal when SM returns no client keys — apply-bundle-env-github-fallback.sh fills gaps.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

REGION="${AWS_REGION:-${REGION:-us-east-2}}"
DB_SECRET_NAME="${DB_URL_SECRET_ID:-db_url}"
export REGION DB_SECRET_NAME

# shellcheck source=_secrets-env.sh
. "$SCRIPT_DIR/_secrets-env.sh"

command -v jq >/dev/null 2>&1 || {
  echo "ERROR: jq is required for fetch-client-bundle-env.sh" >&2
  exit 1
}

EXAMPLE_FILE="$ROOT/Server/.env.example"
if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "ERROR: Missing $EXAMPLE_FILE" >&2
  exit 1
fi

bundle_env_file="$(build_client_bundle_env_file "$EXAMPLE_FILE")"
trap 'rm -f "$bundle_env_file"' EXIT

key_count=0
while IFS= read -r line || [ -n "$line" ]; do
  [ -z "$line" ] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%$'\r'}"
  case "$val" in
    \"*\") val="${val#\"}"; val="${val%\"}" ;;
    \'*\') val="${val#\'}"; val="${val%\'}" ;;
  esac
  len="${#val}"
  if [ "$len" -gt 0 ]; then
    echo "fetch-client-bundle-env: ${key} from AWS SM (length ${len})"
    key_count=$((key_count + 1))
  fi
done <"$bundle_env_file"

if [ "$key_count" -eq 0 ]; then
  echo "fetch-client-bundle-env: no EXPO_PUBLIC_* / VITE_* keys in merged secrets (GitHub fallback may apply)"
else
  echo "fetch-client-bundle-env: found ${key_count} client bundle key(s) in AWS SM"
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  append_env_file_to_github_env "$bundle_env_file" client
else
  echo "fetch-client-bundle-env: GITHUB_ENV not set; skipping export (local dry-run)"
  cat "$bundle_env_file"
fi
