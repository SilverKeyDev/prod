#!/usr/bin/env bash
# docker compose wrapper: loads Client/.env for interpolation; on `build`, passes
# bundle keys as BuildKit --secret mounts (via export-client-env-docker-build-args.mjs).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT/scripts/deploy/prod-parity/docker-compose.yml"
CLIENT_ENV="$ROOT/Client/.env"

compose() {
  docker compose --env-file "$CLIENT_ENV" -f "$COMPOSE_FILE" "$@"
}

if [[ "${1:-}" == "build" ]]; then
  if [[ ! -f "$CLIENT_ENV" ]]; then
    echo "prod-parity compose: ${CLIENT_ENV} missing (run make secrets)" >&2
    exit 1
  fi
  shift
  set -o allexport
  # shellcheck disable=SC1090
  source "$CLIENT_ENV"
  set +o allexport
  export DOCKER_BUILDKIT=1
  BUILD_SECRETS="$(node "$ROOT/Client/scripts/export-client-env-docker-build-args.mjs" "$CLIENT_ENV")"
  # shellcheck disable=SC2086
  compose build "$@" $BUILD_SECRETS
else
  compose "$@"
fi
