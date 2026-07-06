#!/usr/bin/env bash
# Backend dev onboarding: AWS SSO → secrets (prod DATABASE_URL) → verify.
# Usage: ./scripts/setup/setup-dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

die() { echo "setup-dev: $*" >&2; exit 1; }

# shellcheck source=lib/aws-setup.sh
source "${ROOT}/scripts/lib/aws-setup.sh"
# shellcheck source=lib/setup-verify.sh
source "${ROOT}/scripts/lib/setup-verify.sh"

# --- Preflight: core setup must have run first ---
if [[ ! -d "$ROOT/Client/node_modules" ]] || [[ ! -x "$ROOT/Server/.venv/bin/python" ]]; then
  die "Run make setup first (Client node_modules and Server/.venv are required)"
fi

echo "==> Step 1/3: AWS SSO"
if ! aws_setup_login "$ROOT"; then
  die "AWS SSO setup failed (see setup.md — AWS section)"
fi

echo "==> Step 2/3: Server secrets (DATABASE_URL from Secrets Manager)"
make secrets REGION="${AWS_REGION:-us-east-2}" PROFILE="${AWS_PROFILE:-}"

echo "==> Step 3/3: Verify backend"
export SETUP_REQUIRE_REDIS=1
if ! setup_verify_backend "$ROOT"; then
  die "Backend verification failed — fix issues above and re-run make setup-dev"
fi

cat <<EOF

setup-dev: done

  make dev              # web + API
  make dev-db-init      # local Docker only: reset volume + local DATABASE_URL + migrations
  make secrets          # refresh Server/.env (prod DATABASE_URL by default)
  setup.md              # full guide
EOF
