#!/usr/bin/env bash
# Create Server/.venv, install dependencies, and verify core imports.
# Usage: from repo root: bash Server/scripts/bootstrap-venv.sh [--force] [--ci|--lint] [--refresh-deps]
# Optional: PYTHON=/path/to/python3.12 to pick an interpreter (otherwise prefers 3.12 / 3.11 / 3.10 over plain python3).
#
# --force          Remove existing .venv and create a new one (cannot combine with --refresh-deps).
# --ci             Install from requirements/ci.txt only (import smoke, no linters).
# --lint           Install from requirements/lint.txt (ci.txt + ruff + pyright; matches lint.yml).
# --refresh-deps   If .venv exists: re-run pip install in that venv (idempotent). If .venv is missing: create it and install.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FORCE=false
USE_CI=false
USE_LINT=false
REFRESH_DEPS=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --ci) USE_CI=true ;;
    --lint) USE_LINT=true ;;
    --refresh-deps) REFRESH_DEPS=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--force] [--ci|--lint] [--refresh-deps]" >&2
      exit 1
      ;;
  esac
done

if [[ "$USE_CI" == true && "$USE_LINT" == true ]]; then
  echo "bootstrap-venv: use only one of --ci or --lint" >&2
  exit 1
fi

if [[ "$FORCE" == true && "$REFRESH_DEPS" == true ]]; then
  echo "bootstrap-venv: --force cannot be used with --refresh-deps" >&2
  exit 1
fi

cd "$SERVER_DIR"

# Pinned Server deps (e.g. scikit-learn, torch) expect prebuilt wheels; Python 3.14+ often fails to resolve — use 3.10–3.13.
python_supported() {
  "$1" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info < (3, 14) else 1)'
}

PYTHON_CMD="${PYTHON:-}"
if [[ -z "$PYTHON_CMD" ]]; then
  for c in python3.12 python3.11 python3.10 python3; do
    command -v "$c" >/dev/null 2>&1 || continue
    if python_supported "$c"; then
      PYTHON_CMD="$c"
      break
    fi
  done
fi

if [[ -z "$PYTHON_CMD" ]] || ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
  echo "bootstrap-venv: set PYTHON to a Python 3.10–3.13 executable (e.g. export PYTHON=python3.12)." >&2
  exit 1
fi

if ! python_supported "$PYTHON_CMD"; then
  echo "bootstrap-venv: interpreter $(command -v "$PYTHON_CMD") is $( "$PYTHON_CMD" -c 'import sys; print("%s.%s" % sys.version_info[:2])' ) — need Python >=3.10 and <3.14 for current requirements/runtime.txt wheels." >&2
  exit 1
fi

echo "Using Python: $(command -v "$PYTHON_CMD") ($("$PYTHON_CMD" -c 'import sys; print("%s.%s" % sys.version_info[:2])'))"

install_requirements() {
  python -m pip install --upgrade pip
  if [[ "$USE_LINT" == true ]]; then
    echo "Installing from requirements/lint.txt (--lint)"
    pip install -r requirements/lint.txt
  elif [[ "$USE_CI" == true ]]; then
    echo "Installing from requirements/ci.txt (--ci)"
    pip install -r requirements/ci.txt
  else
    echo "Installing from requirements/runtime.txt"
    pip install -r requirements/runtime.txt
    echo "Installing from requirements/dev.txt"
    pip install -r requirements/dev.txt
  fi
}

if [[ "$REFRESH_DEPS" == true ]]; then
  if [[ -d .venv ]]; then
    echo "Refreshing dependencies in existing venv at $SERVER_DIR/.venv"
    # shellcheck source=/dev/null
    source .venv/bin/activate
    install_requirements
  else
    echo "Creating virtual environment at $SERVER_DIR/.venv (--refresh-deps, no existing venv)"
    "$PYTHON_CMD" -m venv .venv
    # shellcheck source=/dev/null
    source .venv/bin/activate
    install_requirements
  fi
elif [[ -d .venv ]]; then
  if [[ "$FORCE" == true ]]; then
    echo "Removing existing .venv (--force)"
    rm -rf .venv
    echo "Creating virtual environment at $SERVER_DIR/.venv"
    "$PYTHON_CMD" -m venv .venv
    # shellcheck source=/dev/null
    source .venv/bin/activate
    install_requirements
  else
    echo "bootstrap-venv: $SERVER_DIR/.venv already exists. Remove it, re-run with --force, or use --refresh-deps." >&2
    exit 1
  fi
else
  echo "Creating virtual environment at $SERVER_DIR/.venv"
  "$PYTHON_CMD" -m venv .venv
  # shellcheck source=/dev/null
  source .venv/bin/activate
  install_requirements
fi

echo "Verifying interpreter and imports..."
python -c 'import sys; assert ".venv" in sys.executable, sys.executable; print("executable:", sys.executable)'
python -c 'import flask; import sqlalchemy; print("flask OK:", flask.__version__)'

echo "Done. Activate with: source Server/.venv/bin/activate (from repo root: source .venv/bin/activate from Server/)"
