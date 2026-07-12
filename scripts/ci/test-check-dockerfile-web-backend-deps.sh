#!/usr/bin/env bash
# Fixture tests for scripts/ci/check-dockerfile-web-backend-deps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECK="$ROOT/scripts/ci/check-dockerfile-web-backend-deps.sh"
TMPDIR_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_ROOT"' EXIT

failures=0

assert_exit() {
  local msg="$1" expected="$2"
  shift 2
  local actual=0
  "$@" >/dev/null 2>&1 || actual=$?
  if [[ "$actual" -eq "$expected" ]]; then
    printf 'OK: %s\n' "$msg"
  else
    printf 'FAIL: %s (expected exit %s, got %s)\n' "$msg" "$expected" "$actual" >&2
    failures=$((failures + 1))
  fi
}

broken="$TMPDIR_ROOT/Dockerfile.broken"
fixed="$TMPDIR_ROOT/Dockerfile.fixed"

cat >"$broken" <<'EOF'
FROM python:3.11-slim AS backend
WORKDIR /app/Server
COPY Server/requirements ./requirements
RUN pip install --upgrade pip \
 && bash scripts/install-torch-cpu.sh \
 && pip install -r requirements/runtime.txt
COPY Server/ .
EOF

cat >"$fixed" <<'EOF'
FROM python:3.11-slim AS backend
WORKDIR /app/Server
COPY Server/requirements ./requirements
COPY Server/scripts/install-torch-cpu.sh ./scripts/install-torch-cpu.sh
RUN pip install --upgrade pip \
 && bash scripts/install-torch-cpu.sh \
 && pip install -r requirements/runtime.txt
COPY Server/ .
EOF

assert_exit "broken COPY order fails" 1 bash "$CHECK" "$broken"
assert_exit "fixed COPY order passes" 0 bash "$CHECK" "$fixed"
assert_exit "repo Dockerfile.web passes" 0 bash "$CHECK" "$ROOT/Dockerfile.web"

if [[ "$failures" -gt 0 ]]; then
  echo "test-check-dockerfile-web-backend-deps: $failures failure(s)" >&2
  exit 1
fi

echo "test-check-dockerfile-web-backend-deps: all checks passed"
