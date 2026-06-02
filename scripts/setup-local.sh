#!/usr/bin/env bash
# First-time / strict local onboarding (Client + Server venv + secrets).
# Usage: ./scripts/setup-local.sh [--skip-secrets] [--force-venv] [--ci]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_SECRETS=false
FORCE_VENV=false
BOOTSTRAP_CI=false
for arg in "$@"; do
  case "$arg" in
    --skip-secrets) SKIP_SECRETS=true ;;
    --force-venv) FORCE_VENV=true ;;
    --ci) BOOTSTRAP_CI=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--skip-secrets] [--force-venv] [--ci]" >&2
      exit 1
      ;;
  esac
done

die() { echo "setup-local: $*" >&2; exit 1; }

python_supported() {
  "$1" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info < (3, 14) else 1)' 2>/dev/null
}

resolve_python() {
  local c
  if [[ -n "${PYTHON:-}" ]] && command -v "$PYTHON" >/dev/null 2>&1 && python_supported "$PYTHON"; then
    return 0
  fi
  local -a candidates=(
    python3.12 python3.11 python3.10
    /opt/homebrew/bin/python3.12
    /opt/homebrew/bin/python3.11
    /opt/homebrew/bin/python3.10
    /usr/local/bin/python3.12
    /usr/local/bin/python3.11
    /usr/local/bin/python3.10
    python3
  )
  for c in "${candidates[@]}"; do
    command -v "$c" >/dev/null 2>&1 || continue
    if python_supported "$c"; then
      export PYTHON="$c"
      return 0
    fi
  done
  return 1
}

# Mark repo-root helper scripts executable so ./scripts/… and bare paths work (not Server/scripts — too large, mixed styles).
if [[ -d "$ROOT/scripts" ]]; then
  echo "==> scripts: chmod +x on *.sh under scripts/"
  find "$ROOT/scripts" -type f -name '*.sh' -exec chmod +x {} +
fi


need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing '$1' in PATH. See README.md / AGENTS.md prerequisites."
}

echo "==> Checking prerequisites"
need_cmd node
need_cmd pnpm
if ! resolve_python; then
  py_ver="not found"
  command -v python3 >/dev/null 2>&1 && py_ver="$(python3 -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo unknown)"
  die "Need Python 3.10–3.13 for Server (default python3 → ${py_ver}). Install: brew install python@3.12 && export PYTHON=/opt/homebrew/bin/python3.12"
fi
echo "    Python OK: $PYTHON ($("$PYTHON" -c 'import sys; print("%s.%s" % sys.version_info[:2])'))"
if ! node -e 'const m=+process.versions.node.split(".")[0]; process.exit(m>=20?0:1)'; then
  die "Need Node.js 20 or newer (found $(node -v))."
fi
if ! pnpm -v 2>/dev/null | grep -qE '^9\.'; then
  die "Need pnpm 9.x (found $(pnpm -v 2>/dev/null || echo none)). Use corepack: corepack prepare pnpm@9.0.0 --activate"
fi

# Match Server/scripts/secrets.sh: optional Server/config/.aws-sso when no keys/profile in env.
verify_aws_cli_and_session() {
  need_cmd aws
  echo "==> Checking AWS CLI (v2) and active credentials"
  if ! aws --version 2>/dev/null | grep -q 'aws-cli/2'; then
    die "Need AWS CLI v2 (SSO and modern auth). Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html — got: $(aws --version 2>/dev/null || echo 'none')"
  fi
  local region="${AWS_REGION:-us-east-2}"
  if [[ -z "${AWS_ACCESS_KEY_ID:-}" && -z "${AWS_PROFILE:-}" && -f "$ROOT/Server/config/.aws-sso" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/Server/config/.aws-sso"
    set +a
  fi
  local -a sts_cmd=(aws sts get-caller-identity --region "$region" --output text --query Account)
  if [[ -z "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_PROFILE:-}" ]]; then
    sts_cmd+=(--profile "$AWS_PROFILE")
  fi
  local account_id
  if ! account_id="$("${sts_cmd[@]}" 2>&1)"; then
    echo "setup-local: ${account_id}" >&2
    echo >&2
    local profile_hint="<your-profile>"
    [[ -n "${AWS_PROFILE:-}" ]] && profile_hint="$AWS_PROFILE"
    echo "setup-local: Fix AWS auth, then re-run without --skip-secrets. Typical SSO:" >&2
    echo "  aws configure sso    # first time: set sso_start_url, sso_region, profile" >&2
    echo "  aws sso login --profile \"${profile_hint}\"" >&2
    echo "  export AWS_PROFILE=\"${profile_hint}\"   # or set AWS_PROFILE in Server/config/.aws-sso" >&2
    echo "  aws sts get-caller-identity" >&2
    echo "Or skip Secrets Manager for now:" >&2
    echo "  make setup ARGS='--skip-secrets'" >&2
    die "AWS session not valid for region ${region} (Secrets Manager fetch would fail)."
  fi
  echo "    AWS CLI OK; caller identity OK (account ${account_id})"
}

if [[ "$SKIP_SECRETS" != true ]]; then
  verify_aws_cli_and_session
fi

echo "==> Client: pnpm install"
(cd Client && pnpm install)

if [[ -d Server/.venv && "$FORCE_VENV" != true ]]; then
  die "Server/.venv already exists. For day-to-day updates run ./scripts/refresh.sh. To recreate the venv here, run: $0 --force-venv"
fi

bootstrap_args=()
if [[ "$FORCE_VENV" == true ]]; then
  bootstrap_args+=(--force)
fi
if [[ "$BOOTSTRAP_CI" == true ]]; then
  bootstrap_args+=(--ci)
fi

echo "==> Server: bootstrap venv"
if ((${#bootstrap_args[@]})); then
  bash Server/scripts/bootstrap-venv.sh "${bootstrap_args[@]}"
else
  bash Server/scripts/bootstrap-venv.sh
fi

if [[ "$SKIP_SECRETS" != true ]]; then
  echo "==> Server: fetch secrets (bash Server/scripts/secrets.sh)"
  bash Server/scripts/secrets.sh "${AWS_REGION:-us-east-2}" "${AWS_PROFILE:-}"
else
  echo "==> Skipped secrets (--skip-secrets). Configure Server/.env manually if needed."
fi

if [[ -f "$ROOT/.pre-commit-config.yaml" && -x "$ROOT/Server/.venv/bin/pip" ]]; then
  if [[ ! -x "$ROOT/Server/.venv/bin/pre-commit" ]]; then
    echo "==> pre-commit: pip install into Server/.venv (e.g. --ci slim venv omits dev extras)"
    "$ROOT/Server/.venv/bin/pip" install -q pre-commit || echo "setup-local: warning: pip install pre-commit failed" >&2
  fi
  if [[ -x "$ROOT/Server/.venv/bin/pre-commit" ]]; then
    if [[ -d "$ROOT/.git" ]]; then
      echo "==> pre-commit: install git hooks"
      (cd "$ROOT" && "$ROOT/Server/.venv/bin/pre-commit" install) || echo "setup-local: warning: pre-commit install failed" >&2
    else
      echo "setup-local: no .git directory; skipping pre-commit install (not a git checkout)"
    fi
  fi
fi

if [[ -f "$ROOT/.cursorignore.example" ]] && [[ ! -f "$ROOT/.cursorignore" ]]; then
  echo "Tip: cp .cursorignore.example .cursorignore  (optional; reduces Cursor indexing noise)"
fi

cat <<EOF

setup-local: done

Next steps:
  Web UI:     cd Client && pnpm dev:web
  API stack:  bash ./scripts/run/run-backend.sh
  Web+API:    bash ./scripts/run/run-web.sh   # or: make dev
  Client QC:  cd Client && pnpm typecheck && pnpm lint
  Repo QC:    bash ./scripts/run-all-linters.sh all   # or: make lint
  Makefile:   make help
  Git hooks:  Server/.venv/bin/pre-commit run --all-files   # or: make precommit
EOF
