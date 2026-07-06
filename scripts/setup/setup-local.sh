#!/usr/bin/env bash
# Core local onboarding: prerequisites → Client + Server env → verify.
# Usage: ./scripts/setup/setup-local.sh [--force-venv] [--ci] [--no-install]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FORCE_VENV=false
BOOTSTRAP_CI=false
NO_INSTALL=false
for arg in "$@"; do
  case "$arg" in
    --force-venv) FORCE_VENV=true ;;
    --ci) BOOTSTRAP_CI=true ;;
    --no-install) NO_INSTALL=true ;;
    --skip-secrets)
      echo "setup-local: --skip-secrets is no longer used (make setup does not run AWS/secrets). Use make setup-dev for backend." >&2
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--force-venv] [--ci] [--no-install]" >&2
      exit 1
      ;;
  esac
done

die() { echo "setup-local: $*" >&2; exit 1; }

# shellcheck source=lib/deps.sh
source "${ROOT}/scripts/lib/deps.sh"
# shellcheck source=lib/setup-verify.sh
source "${ROOT}/scripts/lib/setup-verify.sh"

[[ "$NO_INSTALL" == true ]] && DEPS_NO_INSTALL=true
DEPS_SKIP_AWS_SETUP=true

# --- Step 1/3: prerequisites (install or print commands) ---
if ! deps_ensure_prerequisites; then
  die "Fix prerequisites, then re-run make setup (see setup.md)"
fi

if [[ -d "$ROOT/scripts" ]]; then
  find "$ROOT/scripts" -type f -name '*.sh' -exec chmod +x {} +
fi

# --- Step 2/3: build Client + Server environments ---
echo "==> Step 2/3: Client (pnpm install)"
(cd Client && pnpm install)

bootstrap_args=()
if [[ "$FORCE_VENV" == true ]]; then
  echo "==> Step 2/3: Server (recreating .venv — --force-venv)"
  bootstrap_args+=(--force)
elif [[ -d Server/.venv ]]; then
  echo "==> Step 2/3: Server (refreshing existing .venv)"
  bootstrap_args+=(--refresh-deps)
else
  echo "==> Step 2/3: Server (Python venv)"
fi
[[ "$BOOTSTRAP_CI" == true ]] && bootstrap_args+=(--ci)
# Nounset-safe empty-array expansion (macOS Bash 3.2 errors on "${arr[@]}" when empty).
bash Server/scripts/bootstrap-venv.sh ${bootstrap_args[@]+"${bootstrap_args[@]}"}

# --- Step 3/3: verify ---
echo "==> Step 3/3: Verify"
if ! setup_verify_core "$ROOT"; then
  die "Setup verification failed — fix issues above and re-run make setup"
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

  make dev-web          # web only (works now)
  make setup-dev        # AWS + local DB + Server/.env (needed for make dev)
  make setup-mcp        # optional Cursor MCP tooling
  setup.md              # full guide
EOF
