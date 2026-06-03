#!/usr/bin/env bash
# Planned for removal: GitHub repository secrets as fallback when AWS SM omits a bundle key.
# Primary source is fetch-client-bundle-env.sh (AWS Secrets Manager). Remove this script and
# GITHUB_FALLBACK_* env wiring from ci_web.yml once SM keys are verified in prod for one release.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$ROOT/Client/config/required-bundle-env.json"

command -v jq >/dev/null 2>&1 || {
  echo "ERROR: jq is required for apply-bundle-env-github-fallback.sh" >&2
  exit 1
}

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Missing manifest $MANIFEST" >&2
  exit 1
fi

github_env="${GITHUB_ENV:-}"

resolve_current_value() {
  local key="$1"
  # shellcheck disable=SC2154
  printf '%s' "${!key:-}"
}

while IFS=$'\t' read -r key fallback_name; do
  [ -z "$key" ] && continue
  current="$(resolve_current_value "$key")"
  current="${current#"${current%%[![:space:]]*}"}"
  current="${current%"${current##*[![:space:]]}"}"
  if [ -n "$current" ]; then
    echo "apply-bundle-env-github-fallback: ${key} source=aws (length ${#current})"
    continue
  fi

  fallback_var="GITHUB_FALLBACK_${key}"
  fallback="$(resolve_current_value "$fallback_var")"
  fallback="${fallback#"${fallback%%[![:space:]]*}"}"
  fallback="${fallback%"${fallback##*[![:space:]]}"}"
  if [ -z "$fallback" ]; then
    echo "apply-bundle-env-github-fallback: ${key} missing (no AWS SM value, no GitHub fallback)"
    continue
  fi

  echo "apply-bundle-env-github-fallback: ${key} source=github-fallback (length ${#fallback})"
  if [ -n "$github_env" ]; then
    delim="BUNDLE_FALLBACK_${key}_EOF"
    {
      echo "${key}<<${delim}"
      printf '%s\n' "$fallback"
      echo "${delim}"
    } >>"$github_env"
  else
    export "${key}=${fallback}"
  fi
done < <(
  jq -r '
    .variables[]
    | select(.dockerBuildArg == true)
    | [.key, (.fallbackEnvVar // .githubSecret // .key)]
    | @tsv
  ' "$MANIFEST"
)
