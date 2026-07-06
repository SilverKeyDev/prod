#!/usr/bin/env bash
# Fetch EXPO_PUBLIC_* / VITE_* bundle keys from AWS Secrets Manager for ci_web Docker build.
# Same secret ids as Server/scripts/secrets.sh / Server/.env.example (# From secret: lines).
# AWS SM is the sole CI source — assert-bundle-secrets.mjs fails the build if required keys are missing.
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
  val="$(normalize_env_value "$val")"
  [ -n "$val" ] || continue
  write_client_bundle_env_var "$key" "$val"
  echo "fetch-client-bundle-env: ${key} from AWS SM, added to environment (length ${#val})"
  key_count=$((key_count + 1))
done <"$bundle_env_file"

if [ "$key_count" -eq 0 ]; then
  echo "fetch-client-bundle-env: no EXPO_PUBLIC_* / VITE_* keys in merged secrets — assert-bundle-secrets will fail unless SM has bundle keys"
else
  echo "fetch-client-bundle-env: found ${key_count} client bundle key(s) in AWS SM"
fi
