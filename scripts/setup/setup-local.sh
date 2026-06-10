#!/usr/bin/env bash
# First-time local onboarding: deps → build → AWS SSO → local DB init → verify → MCP.
# Usage: ./scripts/setup/setup-local.sh [--skip-secrets] [--ci] [--no-install]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_SECRETS=false
BOOTSTRAP_CI=false
NO_INSTALL=false
for arg in "$@"; do
  case "$arg" in
    --skip-secrets) SKIP_SECRETS=true ;;
    --force-venv)
      echo "setup-local: --force-venv is no longer required (make setup recreates Server/.venv when present)" >&2
      ;;
    --ci) BOOTSTRAP_CI=true ;;
    --no-install) NO_INSTALL=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--skip-secrets] [--ci] [--no-install]" >&2
      exit 1
      ;;
  esac
done

die() { echo "setup-local: $*" >&2; exit 1; }

# shellcheck source=lib/deps.sh
source "${ROOT}/scripts/lib/deps.sh"
# shellcheck source=lib/aws-setup.sh
source "${ROOT}/scripts/lib/aws-setup.sh"
# shellcheck source=lib/setup-verify.sh
source "${ROOT}/scripts/lib/setup-verify.sh"
# shellcheck source=lib/setup-mcp.sh
source "${ROOT}/scripts/lib/setup-mcp.sh"

[[ "$NO_INSTALL" == true ]] && DEPS_NO_INSTALL=true
[[ "$SKIP_SECRETS" == true ]] && DEPS_SKIP_AWS_SETUP=true

# --- Step 1: prerequisites (install or print commands) ---
if ! deps_ensure_prerequisites; then
  die "Fix prerequisites, then re-run make setup (see setup.md)"
fi

if [[ -d "$ROOT/scripts" ]]; then
  find "$ROOT/scripts" -type f -name '*.sh' -exec chmod +x {} +
fi

# --- Step 2: build Client + Server environments ---
echo "==> Step 2/6: Client (pnpm install)"
(cd Client && pnpm install)

bootstrap_args=()
if [[ -d Server/.venv ]]; then
  echo "==> Step 2/6: Server (removing existing .venv, recreating)"
  bootstrap_args+=(--force)
else
  echo "==> Step 2/6: Server (Python venv)"
fi
[[ "$BOOTSTRAP_CI" == true ]] && bootstrap_args+=(--ci)
bash Server/scripts/bootstrap-venv.sh "${bootstrap_args[@]}"

# --- Step 3–4: AWS SSO + local DB init ---
if [[ "$SKIP_SECRETS" != true ]]; then
  echo "==> Step 3/6: AWS SSO"
  if ! aws_setup_login "$ROOT"; then
    die "AWS SSO setup failed (see setup.md — AWS section)"
  fi

  echo "==> Step 4/6: Local dev database (reset, secrets, migrations)"
  make dev-db-init REGION="${AWS_REGION:-us-east-2}" PROFILE="${AWS_PROFILE:-}"
else
  echo "==> Steps 3–4/6: Skipped AWS SSO, secrets, and local DB init (--skip-secrets)"
  echo "    Copy Server/.env.example to Server/.env and fill values manually."
fi

# --- Step 5: verify ---
echo "==> Step 5/6: Verify"
if ! setup_verify_all "$ROOT" "$SKIP_SECRETS"; then
  die "Setup verification failed — fix issues above and re-run make setup"
fi

# --- Step 6: Cursor MCP (local config, no secrets committed) ---
echo "==> Step 6/6: Cursor MCP"
if ! setup_mcp_configure "$ROOT"; then
  echo "setup-local: MCP step reported errors (see above) — core setup may still be usable" >&2
fi

if [[ -f "$ROOT/.pre-commit-config.yaml" && -x "$ROOT/Server/.venv/bin/pip" ]]; then
  if [[ ! -x "$ROOT/Server/.venv/bin/pre-commit" ]]; then
    echo "==> Optional: pre-commit in Server/.venv"
    "$ROOT/Server/.venv/bin/pip" install -q pre-commit || true
  fi
  if [[ -x "$ROOT/Server/.venv/bin/pre-commit" && -d "$ROOT/.git" ]]; then
    git -C "$ROOT" config core.hooksPath scripts/githooks || true
  fi
fi

[[ -f "$ROOT/.cursorignore.example" && ! -f "$ROOT/.cursorignore" ]] && \
  echo "Tip: cp .cursorignore.example .cursorignore"

cat <<EOF

setup-local: done

  make dev              # web + API (DB initialized by setup)
  make dev-db-init      # reset local DB + secrets + migrations
  make dev-web          # web only
  setup.md              # full guide (incl. Cursor MCP — step 6)
EOF
