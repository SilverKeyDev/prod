#!/usr/bin/env bash
# Tests setup-verify DATABASE_URL acceptance (local + remote); no AWS.
# Called by: make check-docs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../lib/setup-verify.sh
source "${ROOT}/scripts/lib/setup-verify.sh"

failures=0
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

write_env() {
  local database_url="$1"
  mkdir -p "${tmpdir}/Server"
  cat >"${tmpdir}/Server/.env" <<EOF
DATABASE_URL="${database_url}"
JWT_SIGNING_SECRET="test-jwt-secret"
EOF
}

run_verify() {
  local label="$1" expect_ok="$2"
  if setup_verify_env_file "${tmpdir}"; then
    if [[ "$expect_ok" == "ok" ]]; then
      printf 'OK: %s\n' "$label"
    else
      printf 'FAIL: %s (expected failure)\n' "$label" >&2
      failures=$((failures + 1))
    fi
  else
    if [[ "$expect_ok" == "fail" ]]; then
      printf 'OK: %s\n' "$label"
    else
      printf 'FAIL: %s (expected success)\n' "$label" >&2
      failures=$((failures + 1))
    fi
  fi
}

write_env "postgresql://postgres:pass@prod-mock.rds.amazonaws.com:5432/postgres"
run_verify "remote DATABASE_URL accepted" ok

write_env "postgresql://silverkey:silverkey@localhost:5432/silverkey_dev"
run_verify "local DATABASE_URL accepted" ok

write_env ""
run_verify "empty DATABASE_URL rejected" fail

rm -f "${tmpdir}/Server/.env"
run_verify "missing Server/.env rejected" fail

if [[ "$failures" -gt 0 ]]; then
  echo "test-setup-verify-database: $failures failure(s)" >&2
  exit 1
fi

echo "test-setup-verify-database: all checks passed"
