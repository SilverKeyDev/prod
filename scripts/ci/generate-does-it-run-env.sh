#!/usr/bin/env bash
# Generate stub Server + Client env files for does-it-run CI smoke (no AWS / no real secrets).
# Usage (repo root):
#   export DOES_IT_RUN_ENV_DIR="$(mktemp -d)"
#   DOES_IT_RUN_DB_MODE=lightweight bash scripts/ci/generate-does-it-run-env.sh
# Then read: $DOES_IT_RUN_ENV_DIR/server.env and client.env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_EXAMPLE="$ROOT/Server/.env.example"
DB_MODE="${DOES_IT_RUN_DB_MODE:-lightweight}"

if [[ -z "${DOES_IT_RUN_ENV_DIR:-}" ]]; then
  DOES_IT_RUN_ENV_DIR="$(mktemp -d)"
  export DOES_IT_RUN_ENV_DIR
fi
mkdir -p "$DOES_IT_RUN_ENV_DIR"

SERVER_ENV="$DOES_IT_RUN_ENV_DIR/server.env"
CLIENT_ENV="$DOES_IT_RUN_ENV_DIR/client.env"

if [[ "$DB_MODE" == "docker" ]]; then
  DATABASE_URL="postgresql://silverkey:silverkey@postgres:5432/silverkey_ci"
else
  DATABASE_URL="postgresql://silverkey:silverkey@127.0.0.1:5432/silverkey_ci"
fi

REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
if [[ "$DB_MODE" == "docker" ]]; then
  REDIS_URL="redis://redis:6379/0"
fi

stub_server_value() {
  local key="$1"
  case "$key" in
    DATABASE_URL) echo "$DATABASE_URL" ;;
    REDIS_URL | CELERY_URL) echo "$REDIS_URL" ;;
    JWT_SIGNING_SECRET) echo "ci-smoke-jwt-signing-secret-not-for-production-min32" ;;
    AWS_COGNITO_USER_POOL_ID) echo "us-east-2_ciSmokeStubPoolId" ;;
    AWS_COGNITO_CLIENT_ID) echo "ci-smoke-cognito-client-id" ;;
    AWS_COGNITO_CLIENT_SECRET) echo "ci-smoke-cognito-client-secret" ;;
    PERPLEXITY_API_KEY) echo "ci-smoke-perplexity-not-for-production" ;;
    OPENAI_KEY) echo "ci-smoke-openai-not-for-production" ;;
    GOOGLE_MAPS_API_KEY) echo "ci-smoke-gmaps-not-for-production" ;;
    CENSUS_API_KEY) echo "ci-smoke-census-not-for-production" ;;
    SERP_API) echo "ci-smoke-serp-not-for-production" ;;
    SLIPSTREAM_PRIVATE) echo "ci-smoke-slipstream-private-not-for-production" ;;
    SLIPSTREAM_PUBLIC) echo "ci-smoke-slipstream-public-not-for-production" ;;
    POSTHOG_PROJECT_TOKEN) echo "ci-smoke-posthog-not-for-production" ;;
    POSTHOG_QUERY_API_KEY) echo "ci-smoke-posthog-query-not-for-production" ;;
    *)
      local lower
      lower="$(printf '%s' "$key" | tr '[:upper:]' '[:lower:]')"
      echo "ci-smoke-${lower}"
      ;;
  esac
}

: >"$SERVER_ENV"
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[[:space:]]*$ ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
    key="${BASH_REMATCH[1]}"
    printf '%s=%s\n' "$key" "$(stub_server_value "$key")" >>"$SERVER_ENV"
  fi
done <"$SERVER_EXAMPLE"

# DATABASE_URL / Redis are required at import time (app/config/database.py) but are not
# always present in .env.example after secrets.sh regeneration (username/password/host fields).
{
  printf 'DATABASE_URL=%s\n' "$DATABASE_URL"
  printf 'REDIS_URL=%s\n' "$REDIS_URL"
  printf 'CELERY_URL=%s\n' "$REDIS_URL"
} >>"$SERVER_ENV"

cat >"$CLIENT_ENV" <<'EOF'
EXPO_PUBLIC_GOOGLE_MAPS_ID=ci-smoke-map-01
EXPO_PUBLIC_POSTHOG_KEY=phc_ci_smoke01
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
EXPO_PUBLIC_PLAID_CLIENT_ID=
EOF

export DOES_IT_RUN_SERVER_ENV="$SERVER_ENV"
export DOES_IT_RUN_CLIENT_ENV="$CLIENT_ENV"

echo "generate-does-it-run-env: wrote server.env ($(wc -l <"$SERVER_ENV" | tr -d ' ') keys) and client.env"
echo "generate-does-it-run-env: DOES_IT_RUN_SERVER_ENV=$SERVER_ENV"
echo "generate-does-it-run-env: DOES_IT_RUN_CLIENT_ENV=$CLIENT_ENV"
