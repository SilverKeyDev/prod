#!/usr/bin/env bash
# docker compose wrapper: loads Client/.env for interpolation; on `build`, passes
# bundle keys as BuildKit --secret mounts (via export-client-env-docker-build-args.mjs).
# Optional: CLIENT_ENV_FILE, SERVER_ENV_FILE, COMPOSE_FILE_EXTRA (overlay), COMPOSE_PROJECT_NAME
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT/scripts/deploy/prod-parity/docker-compose.yml"
CLIENT_ENV="${CLIENT_ENV_FILE:-$ROOT/Client/.env}"

compose_files=(-f "$COMPOSE_FILE")
if [[ -n "${COMPOSE_FILE_EXTRA:-}" ]]; then
  compose_files+=(-f "$COMPOSE_FILE_EXTRA")
fi

if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
  export COMPOSE_PROJECT_NAME
fi

compose() {
  # shellcheck disable=SC2086
  docker compose --env-file "$CLIENT_ENV" "${compose_files[@]}" "$@"
}

if [[ "${1:-}" == "build" ]]; then
  if [[ ! -f "$CLIENT_ENV" ]]; then
    echo "prod-parity compose: ${CLIENT_ENV} missing (run make secrets or set CLIENT_ENV_FILE)" >&2
    exit 1
  fi
  shift
  set -o allexport
  # shellcheck disable=SC1090
  source "$CLIENT_ENV"
  set +o allexport
  export DOCKER_BUILDKIT=1
  BUILD_SECRETS="$(node "$ROOT/Client/scripts/export-client-env-docker-build-args.mjs" "$CLIENT_ENV")"
  if [[ -n "${BUILD_SECRETS// /}" ]]; then
    # docker compose build does not accept BuildKit --secret flags; build the shared
    # backend image once with buildx, tag for app/worker/beat, then skip compose rebuild.
    project="${COMPOSE_PROJECT_NAME:-silverkey-prod-parity}"
    primary_image="${project}-app"
    echo "prod-parity compose: building ${primary_image} with buildx (bundle secrets)..."
    # shellcheck disable=SC2086
    docker buildx build $BUILD_SECRETS \
      -f "$ROOT/Dockerfile.web" \
      --target backend \
      --load \
      -t "$primary_image" \
      "$ROOT" "$@"
    for svc in worker beat; do
      docker tag "$primary_image" "${project}-${svc}"
    done
  else
    # shellcheck disable=SC2086
    compose build "$@" $BUILD_SECRETS
  fi
else
  compose "$@"
fi
