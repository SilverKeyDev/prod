#!/usr/bin/env bash
# Integration tests for Server/scripts/secrets.sh with mock AWS (no SSO/network).
# Called by: make check-docs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOCK_AWS_DIR="${ROOT}/scripts/ci/fixtures/mock-aws"
failures=0
cleanup_dirs=()
cleanup_stderr_files=()

prepare_workspace() {
  local dest="$1"
  mkdir -p "${dest}/scripts/lib" "${dest}/Server/scripts" "${dest}/Client"
  cp -R "${ROOT}/scripts/lib/"* "${dest}/scripts/lib/"
  cp "${ROOT}/Server/scripts/secrets.sh" "${dest}/Server/scripts/secrets.sh"
}

run_secrets() {
  local workspace="$1"
  shift
  (
    cd "${workspace}/Server"
    export PATH="${MOCK_AWS_DIR}:${PATH}"
    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
    unset DATABASE_URL MOCK_AWS_SECRET_NAMES USE_LOCAL_DATABASE
    export AWS_PROFILE=mock-profile
    export AWS_SSO_NO_AUTO_LOGIN=1
    if [[ $# -gt 0 ]]; then
      env "$@" sh scripts/secrets.sh us-east-2 mock-profile
    else
      sh scripts/secrets.sh us-east-2 mock-profile
    fi
  )
}

assert_stderr_contains() {
  local msg="$1" stderr_file="$2" pattern="$3"
  if grep -q "$pattern" "$stderr_file"; then
    printf 'OK: %s\n' "$msg"
  else
    printf 'FAIL: %s (pattern %s not in stderr)\n' "$msg" "$pattern" >&2
    failures=$((failures + 1))
  fi
}

assert_file_contains() {
  local msg="$1" file="$2" pattern="$3"
  if grep -q "$pattern" "$file"; then
    printf 'OK: %s\n' "$msg"
  else
    printf 'FAIL: %s (pattern %s not in %s)\n' "$msg" "$pattern" "$file" >&2
    failures=$((failures + 1))
  fi
}

assert_file_not_contains() {
  local msg="$1" file="$2" pattern="$3"
  if grep -q "$pattern" "$file"; then
    printf 'FAIL: %s (unexpected pattern %s in %s)\n' "$msg" "$pattern" "$file" >&2
    failures=$((failures + 1))
  else
    printf 'OK: %s\n' "$msg"
  fi
}

assert_exit_nonzero() {
  local msg="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'FAIL: %s (expected non-zero exit)\n' "$msg" >&2
    failures=$((failures + 1))
  else
    printf 'OK: %s\n' "$msg"
  fi
}

workspace_a="$(mktemp -d)"
cleanup_dirs+=("$workspace_a")
prepare_workspace "$workspace_a"
run_secrets "$workspace_a"
env_file="${workspace_a}/Server/.env"
assert_file_contains "default fetch writes prod RDS host" "$env_file" "prod-mock.rds.amazonaws.com"
assert_file_not_contains "default fetch does not use silverkey_dev" "$env_file" "silverkey_dev"
assert_file_contains "default fetch includes JWT from cognito secret" "$env_file" "mock-jwt-signing-secret"
example_file="${workspace_a}/Server/.env.example"
assert_file_contains "default fetch writes empty JWT placeholder in .env.example" "$example_file" 'JWT_SIGNING_SECRET=""'

workspace_b="$(mktemp -d)"
cleanup_dirs+=("$workspace_b")
prepare_workspace "$workspace_b"
run_secrets "$workspace_b" env USE_LOCAL_DATABASE=1
env_file_b="${workspace_b}/Server/.env"
assert_file_not_contains "local mode skips prod RDS host" "$env_file_b" "prod-mock.rds.amazonaws.com"
assert_file_contains "local mode injects localhost DATABASE_URL" "$env_file_b" "localhost:5432/silverkey_dev"

workspace_c="$(mktemp -d)"
cleanup_dirs+=("$workspace_c")
prepare_workspace "$workspace_c"
assert_exit_nonzero "missing db secret fails" \
  run_secrets "$workspace_c" env MOCK_AWS_SECRET_NAMES=cognito

workspace_d="$(mktemp -d)"
cleanup_dirs+=("$workspace_d")
prepare_workspace "$workspace_d"
run_secrets "$workspace_d" env MOCK_AWS_SECRET_NAMES="db_url cognito gmaps"
client_env="${workspace_d}/Client/.env"
server_env_d="${workspace_d}/Server/.env"
assert_file_contains "EXPO_PUBLIC keys land in Client/.env" "$client_env" "EXPO_PUBLIC_POSTHOG_KEY="
assert_file_contains "EXPO_PUBLIC value in Client/.env" "$client_env" "ph_mock_test_key"
assert_file_not_contains "EXPO_PUBLIC keys stripped from Server/.env" "$server_env_d" "EXPO_PUBLIC_POSTHOG_KEY"
assert_file_contains "server-only keys stay in Server/.env" "$server_env_d" "GOOGLE_MAPS_SERVER_KEY="
assert_file_contains "server-only value in Server/.env" "$server_env_d" "server-only-not-client"

workspace_e="$(mktemp -d)"
cleanup_dirs+=("$workspace_e")
prepare_workspace "$workspace_e"
mkdir -p "${workspace_e}/Server"
printf '%s\n' 'DATABASE_URL="postgresql://silverkey:silverkey@127.0.0.1:5433/custom_dev"' \
  >"${workspace_e}/Server/.env"
run_secrets "$workspace_e" env USE_LOCAL_DATABASE=1 MOCK_AWS_SECRET_NAMES=cognito
env_file_e="${workspace_e}/Server/.env"
assert_file_contains "local mode preserves existing local DATABASE_URL" "$env_file_e" "127.0.0.1:5433/custom_dev"
assert_file_not_contains "local mode does not overwrite with default localhost" "$env_file_e" "localhost:5432/silverkey_dev"

workspace_f="$(mktemp -d)"
cleanup_dirs+=("$workspace_f")
prepare_workspace "$workspace_f"
stderr_f="$(mktemp)"
cleanup_stderr_files=("$stderr_f")
(
  cd "${workspace_f}/Server"
  export PATH="${MOCK_AWS_DIR}:${PATH}"
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
  unset DATABASE_URL USE_LOCAL_DATABASE
  export AWS_PROFILE=mock-profile
  export AWS_SSO_NO_AUTO_LOGIN=1
  export MOCK_AWS_SECRET_NAMES="db_url cognito duplicate_keys"
  sh scripts/secrets.sh us-east-2 mock-profile 2>"$stderr_f"
)
env_file_f="${workspace_f}/Server/.env"
assert_file_contains "duplicate keys both written to .env" "$env_file_f" "duplicate-secret-value"
assert_stderr_contains "duplicate key warning on stderr" "$stderr_f" "Warning: duplicate env key JWT_SIGNING_SECRET"
assert_stderr_contains "duplicate key notes first-wins" "$stderr_f" "python-dotenv uses the first occurrence"

workspace_g="$(mktemp -d)"
cleanup_dirs+=("$workspace_g")
prepare_workspace "$workspace_g"
run_secrets "$workspace_g" env MOCK_AWS_SECRET_NAMES="db_url dotenv_test"
env_file_g="${workspace_g}/Server/.env"
assert_file_contains "dotenv secret normalized FOO" "$env_file_g" "DOTENV_FOO="
assert_file_contains "dotenv secret FOO value" "$env_file_g" "bar"
assert_file_contains "dotenv secret normalized BAZ" "$env_file_g" "DOTENV_BAZ="
assert_file_contains "dotenv secret BAZ value" "$env_file_g" "quoted"

workspace_h="$(mktemp -d)"
cleanup_dirs+=("$workspace_h")
prepare_workspace "$workspace_h"
run_secrets "$workspace_h" env MOCK_AWS_SECRET_NAMES="db_url shell_metachar cognito"
env_file_h="${workspace_h}/Server/.env"
assert_file_contains "shell metachar secret written" "$env_file_h" "SKYSLOPE_SECRET="
if (
  cd "${workspace_h}/Server"
  "${ROOT}/Server/.venv/bin/python" -c "from dotenv import dotenv_values; import sys; sys.exit(0 if dotenv_values('.env').get('SKYSLOPE_SECRET') else 1)"
); then
  printf 'OK: shell metachar .env is python-dotenv parseable\n'
else
  printf 'FAIL: shell metachar .env is not python-dotenv parseable\n' >&2
  failures=$((failures + 1))
fi

for dir in "${cleanup_dirs[@]}"; do
  rm -rf "$dir"
done
for f in "${cleanup_stderr_files[@]}"; do
  rm -f "$f"
done

if [[ "$failures" -gt 0 ]]; then
  echo "test-secrets-retrieval: $failures failure(s)" >&2
  exit 1
fi

echo "test-secrets-retrieval: all checks passed"
