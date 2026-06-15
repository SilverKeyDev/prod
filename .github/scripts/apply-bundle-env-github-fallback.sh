#!/usr/bin/env bash
# Planned for removal: GitHub repository secrets as fallback when AWS SM omits a bundle key.
# Primary source is fetch-client-bundle-env.sh (AWS Secrets Manager). Remove this script and
# GITHUB_FALLBACK_* env wiring from ci_web.yml once SM keys are verified in prod for one release.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$ROOT/Client/config/required-bundle-env.json"

# shellcheck source=_secrets-env.sh
. "$SCRIPT_DIR/_secrets-env.sh"

command -v jq >/dev/null 2>&1 || {
  echo "ERROR: jq is required for apply-bundle-env-github-fallback.sh" >&2
  exit 1
}

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Missing manifest $MANIFEST" >&2
  exit 1
fi

resolve_current_value() {
  local key="$1"
  # shellcheck disable=SC2154
  printf '%s' "${!key:-}"
}

while IFS=$'\t' read -r key fallback_name; do
  [ -z "$key" ] && continue
  current="$(normalize_env_value "$(resolve_current_value "$key")")"
  if [ -n "$current" ]; then
    write_client_bundle_env_var "$key" "$current"
    echo "apply-bundle-env-github-fallback: ${key} source=aws, added to environment (length ${#current})"
    continue
  fi

  fallback_var="GITHUB_FALLBACK_${key}"
  fallback="$(normalize_env_value "$(resolve_current_value "$fallback_var")")"
  if [ -z "$fallback" ]; then
    echo "apply-bundle-env-github-fallback: ${key} missing (no AWS SM value, no GitHub fallback)"
    continue
  fi

  write_client_bundle_env_var "$key" "$fallback"
  echo "apply-bundle-env-github-fallback: ${key} source=github-fallback, added to environment (length ${#fallback})"
done < <(
  jq -r '
    .variables[]
    | select(.dockerBuildArg == true)
    | [.key, (.fallbackEnvVar // .githubSecret // .key)]
    | @tsv
  ' "$MANIFEST"
)
