#!/usr/bin/env bash
# First-time local onboarding: deps → build → AWS SSO → secrets → verify.
# Usage: ./scripts/setup-local.sh [--skip-secrets] [--force-venv] [--ci] [--no-install]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_SECRETS=false
FORCE_VENV=false
BOOTSTRAP_CI=false
NO_INSTALL=false
for arg in "$@"; do
  case "$arg" in
    --skip-secrets) SKIP_SECRETS=true ;;
    --force-venv) FORCE_VENV=true ;;
    --ci) BOOTSTRAP_CI=true ;;
    --no-install) NO_INSTALL=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--skip-secrets] [--force-venv] [--ci] [--no-install]" >&2
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
echo "==> Step 2/5: Client (pnpm install)"
(cd Client && pnpm install)

if [[ -d Server/.venv && "$FORCE_VENV" != true ]]; then
  die "Server/.venv already exists. Use: make refresh  OR  make setup ARGS='--force-venv'"
fi

bootstrap_args=()
[[ "$FORCE_VENV" == true ]] && bootstrap_args+=(--force)
[[ "$BOOTSTRAP_CI" == true ]] && bootstrap_args+=(--ci)

echo "==> Step 2/5: Server (Python venv)"
bash Server/scripts/bootstrap-venv.sh "${bootstrap_args[@]}"

# --- Step 3–4: AWS SSO + secrets ---
if [[ "$SKIP_SECRETS" != true ]]; then
  echo "==> Step 3/5: AWS SSO"
  if ! aws_setup_login "$ROOT"; then
    die "AWS SSO setup failed (see setup.md — AWS section)"
  fi
  # Export profile/region for secrets.sh (sourced from .aws-sso in aws_setup_login)
  aws_setup_load_env "$ROOT"

  echo "==> Step 4/5: Secrets (Server/.env)"
  bash Server/scripts/secrets.sh "${AWS_REGION:-us-east-2}" "${AWS_PROFILE:-}"
else
  echo "==> Steps 3–4/5: Skipped AWS SSO and secrets (--skip-secrets)"
  echo "    Copy Server/.env.example to Server/.env and fill values manually."
fi

# --- Step 5: verify ---
echo "==> Step 5/5: Verify"
if ! setup_verify_all "$ROOT" "$SKIP_SECRETS"; then
  die "Setup verification failed — fix issues above and re-run make setup"
fi

if [[ -f "$ROOT/.pre-commit-config.yaml" && -x "$ROOT/Server/.venv/bin/pip" ]]; then
  if [[ ! -x "$ROOT/Server/.venv/bin/pre-commit" ]]; then
    echo "==> Optional: pre-commit in Server/.venv"
    "$ROOT/Server/.venv/bin/pip" install -q pre-commit || true
  fi
  if [[ -x "$ROOT/Server/.venv/bin/pre-commit" && -d "$ROOT/.git" ]]; then
    (cd "$ROOT" && "$ROOT/Server/.venv/bin/pre-commit" install) || true
  fi
fi

[[ -f "$ROOT/.cursorignore.example" && ! -f "$ROOT/.cursorignore" ]] && \
  echo "Tip: cp .cursorignore.example .cursorignore"

cat <<EOF

setup-local: done

  make dev              # web + API
  make dev-web          # web only
  setup.md              # full guide
EOF
