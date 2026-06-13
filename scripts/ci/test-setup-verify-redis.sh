#!/usr/bin/env bash
# Tests setup_verify_redis soft vs strict modes; no live Redis required.
# Called by: make check-docs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../lib/setup-verify.sh
source "${ROOT}/scripts/lib/setup-verify.sh"

failures=0
mock_bin="$(mktemp -d)"
trap 'rm -rf "$mock_bin"' EXIT

cat >"${mock_bin}/redis-cli" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "${mock_bin}/redis-cli"

run_verify() {
  local label="$1" require_redis="$2" expect_ok="$3"
  local rc=0
  PATH="${mock_bin}:${PATH}" SETUP_REQUIRE_REDIS="${require_redis}" setup_verify_redis >/dev/null 2>&1 || rc=$?
  if [[ "$expect_ok" == "ok" && "$rc" -eq 0 ]]; then
    printf 'OK: %s\n' "$label"
    return 0
  fi
  if [[ "$expect_ok" == "fail" && "$rc" -ne 0 ]]; then
    printf 'OK: %s\n' "$label"
    return 0
  fi
  printf 'FAIL: %s (expected %s, got exit %s)\n' "$label" "$expect_ok" "$rc" >&2
  failures=$((failures + 1))
}

run_verify "soft mode when Redis unreachable" 0 ok
run_verify "strict mode when Redis unreachable" 1 fail

if [[ "$failures" -gt 0 ]]; then
  echo "test-setup-verify-redis: $failures failure(s)" >&2
  exit 1
fi

echo "test-setup-verify-redis: all checks passed"
