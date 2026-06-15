#!/usr/bin/env bash
# Unit tests for scripts/lib/secrets-database-url.sh (no AWS).
# Called by: make check-docs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../lib/secrets-database-url.sh
source "${ROOT}/scripts/lib/secrets-database-url.sh"

failures=0

assert_true() {
  local msg="$1"
  shift
  if "$@"; then
    printf 'OK: %s\n' "$msg"
  else
    printf 'FAIL: %s\n' "$msg" >&2
    failures=$((failures + 1))
  fi
}

assert_false() {
  local msg="$1"
  shift
  if "$@"; then
    printf 'FAIL: %s (expected false)\n' "$msg" >&2
    failures=$((failures + 1))
  else
    printf 'OK: %s\n' "$msg"
  fi
}

assert_eq() {
  local msg="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf 'OK: %s\n' "$msg"
  else
    printf 'FAIL: %s (expected %s, got %s)\n' "$msg" "$expected" "$actual" >&2
    failures=$((failures + 1))
  fi
}

assert_true "db_url is database secret" secrets_is_database_secret_name db_url
assert_true "silverkey/prod/db is database secret" secrets_is_database_secret_name silverkey/prod/db
assert_false "cognito is not database secret" secrets_is_database_secret_name cognito

assert_true "localhost is local URL" secrets_is_local_database_url "postgresql://silverkey:silverkey@localhost:5432/silverkey_dev"
assert_true "postgres:5432 is local URL" secrets_is_local_database_url "postgresql://silverkey:silverkey@postgres:5432/silverkey_dev"
assert_false "RDS host is not local URL" secrets_is_local_database_url "postgresql://postgres:pass@prod-mock.rds.amazonaws.com:5432/postgres"

tmp_env="$(mktemp)"
trap 'rm -f "$tmp_env"' EXIT
printf '%s\n' 'DATABASE_URL="postgresql://silverkey:silverkey@localhost:5432/silverkey_dev"' >"$tmp_env"
assert_eq \
  "secrets_env_file_value reads quoted DATABASE_URL" \
  "postgresql://silverkey:silverkey@localhost:5432/silverkey_dev" \
  "$(secrets_env_file_value DATABASE_URL "$tmp_env")"

if [[ "$failures" -gt 0 ]]; then
  echo "test-secrets-database-url: $failures failure(s)" >&2
  exit 1
fi

echo "test-secrets-database-url: all checks passed"
