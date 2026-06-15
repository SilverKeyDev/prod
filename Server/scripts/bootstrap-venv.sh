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

ROOT="$(cd "$SERVER_DIR/.." && pwd)"
# shellcheck source=../../scripts/lib/deps.sh
source "${ROOT}/scripts/lib/deps.sh"

PYTHON_CMD="${PYTHON:-}"
if [[ -z "$PYTHON_CMD" ]]; then
  PYTHON_CMD="$(deps_find_python)" || true
fi

if [[ -z "$PYTHON_CMD" ]] || ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
  echo "bootstrap-venv: need Python 3.10–3.13 (macOS system python3 is often 3.9)." >&2
  if command -v python3 >/dev/null 2>&1; then
    echo "bootstrap-venv: found $(command -v python3) → $(python3 -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo unknown)" >&2
  fi
  echo "bootstrap-venv: install Python 3.12, then re-run setup:" >&2
  echo "  brew install python@3.12" >&2
  echo "  export PYTHON=/opt/homebrew/bin/python3.12   # Apple Silicon" >&2
  echo "  export PYTHON=/usr/local/bin/python3.12      # Intel Mac" >&2
  echo "  make setup ARGS='--force-venv'" >&2
  exit 1
fi

if ! deps_python_ok "$PYTHON_CMD"; then
  echo "bootstrap-venv: interpreter $(command -v "$PYTHON_CMD") is $( "$PYTHON_CMD" -c 'import sys; print("%s.%s" % sys.version_info[:2])' ) — need Python >=3.10 and <3.14 for current requirements/runtime.txt wheels." >&2
  echo "bootstrap-venv: export PYTHON=python3.12 (or brew install python@3.12), then: make setup ARGS='--force-venv'" >&2
  exit 1
fi

echo "Using Python: $(command -v "$PYTHON_CMD") ($("$PYTHON_CMD" -c 'import sys; print("%s.%s" % sys.version_info[:2])'))"

ensure_macos_pillow_deps() {
  [[ "$(uname -s)" == Darwin ]] || return 0
  command -v brew >/dev/null 2>&1 || return 0
  local -a pkgs=(jpeg zlib libpng libtiff little-cms2 openjpeg webp)
  local -a missing=()
  local pkg
  for pkg in "${pkgs[@]}"; do
    brew list "$pkg" &>/dev/null || missing+=("$pkg")
  done
  if ((${#missing[@]})); then
    echo "bootstrap-venv: installing Homebrew libs for Pillow (if pip still builds from source): ${missing[*]}"
    brew install "${missing[@]}"
  fi
  local brew_prefix
  brew_prefix="$(brew --prefix)"
  export PKG_CONFIG_PATH="${brew_prefix}/opt/jpeg/lib/pkgconfig:${brew_prefix}/opt/libpng/lib/pkgconfig:${brew_prefix}/opt/libtiff/lib/pkgconfig:${PKG_CONFIG_PATH:-}"
  export CPPFLAGS="-I${brew_prefix}/opt/jpeg/include -I${brew_prefix}/opt/libpng/include ${CPPFLAGS:-}"
  export LDFLAGS="-L${brew_prefix}/opt/jpeg/lib -L${brew_prefix}/opt/libpng/lib ${LDFLAGS:-}"
}

ensure_pip() {
  if python -m pip --version >/dev/null 2>&1; then
    return 0
  fi
  echo "bootstrap-venv: pip missing in venv; bootstrapping with ensurepip"
  python -m ensurepip --upgrade
}

install_torch_optional() {
  TORCH_OPTIONAL_SKIP=0
  [[ "$(uname -s)" == Linux ]] || return 0

  local arch
  arch="$(uname -m)"
  if [[ "$arch" == "x86_64" ]]; then
    echo "Installing CPU-only torch (linux x86_64) from download.pytorch.org/whl/cpu"
    if pip install torch==2.10.0 --index-url https://download.pytorch.org/whl/cpu; then
      return 0
    fi
  elif [[ "$arch" == "aarch64" || "$arch" == "arm64" ]]; then
    echo "Installing torch (linux ${arch}) from PyPI"
    if pip install torch==2.10.0; then
      return 0
    fi
  else
    echo "bootstrap-venv: WARN unsupported linux arch for torch pre-install (${arch}) — trying PyPI"
    if pip install torch==2.10.0; then
      return 0
    fi
  fi

  TORCH_OPTIONAL_SKIP=1
  echo "bootstrap-venv: WARN torch install failed — continuing; install manually if you need ML features" >&2
}

pip_install_requirements_file() {
  local file="$1"
  if [[ "${TORCH_OPTIONAL_SKIP:-0}" == "1" ]]; then
    echo "Installing from ${file} (excluding torch pin — install torch manually for ML features)"
    grep -v '^torch==' "$file" | pip install -r /dev/stdin
    return 0
  fi
  pip install -r "$file"
}

install_requirements() {
  ensure_pip
  ensure_macos_pillow_deps
  export PIP_PREFER_BINARY=1
  python -m pip install --upgrade pip
  if [[ "$USE_LINT" == true ]]; then
    echo "Installing from requirements/lint.txt (--lint)"
    pip install -r requirements/lint.txt
  elif [[ "$USE_CI" == true ]]; then
    echo "Installing from requirements/ci.txt (--ci)"
    pip install -r requirements/ci.txt
  else
    # On linux the bare `torch` pin in runtime.txt resolves to the multi-GB CUDA wheel,
    # but there is no GPU in dev/Cloud either. Pre-install the CPU wheel so it satisfies
    # the pin without pulling CUDA. macOS PyPI torch is already CPU-only, so skip it there.
    install_torch_optional
    echo "Installing from requirements/runtime.txt"
    pip_install_requirements_file requirements/runtime.txt
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
