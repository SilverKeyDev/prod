# Prerequisite checks and install helpers for make setup.
# shellcheck shell=bash

DEPS_PNPM_VERSION="${DEPS_PNPM_VERSION:-9.0.0}"
DEPS_SETUP_DOC="${DEPS_SETUP_DOC:-setup.md}"
DEPS_SKIP_AWS=false
DEPS_NO_INSTALL=false
DEPS_ENSURE_MODE=false # true = setup may brew-install missing tools
DEPS_SKIP_AWS_SETUP=false

deps_die() { echo "deps: $*" >&2; exit 1; }
deps_have() { command -v "$1" >/dev/null 2>&1; }

deps_check_node() {
  deps_have node && node -e 'process.exit(+process.versions.node.split(".")[0]>=20?0:1)' 2>/dev/null
}

deps_check_pnpm() {
  deps_have pnpm && pnpm -v 2>/dev/null | grep -qE '^9\.'
}

deps_python_ok() {
  local py="$1"
  "$py" -c 'import sys; sys.exit(0 if (3,10)<=sys.version_info<(3,14) else 1)' 2>/dev/null
}

deps_find_python() {
  local c
  for c in "${PYTHON:-}" python3.12 python3.11 python3.10 python3; do
    [[ -n "$c" ]] && deps_have "$c" && deps_python_ok "$c" && { echo "$c"; return 0; }
  done
  return 1
}

deps_check_python() { deps_find_python >/dev/null 2>&1; }
deps_check_aws_cli() { deps_have aws && aws --version 2>/dev/null | grep -q 'aws-cli/2'; }

deps_brew_path_python() {
  if [[ -d /opt/homebrew/opt/python@3.12/bin ]]; then
    export PATH="/opt/homebrew/opt/python@3.12/bin:$PATH"
  elif [[ -d /usr/local/opt/python@3.12/bin ]]; then
    export PATH="/usr/local/opt/python@3.12/bin:$PATH"
  fi
}

deps_try_corepack_pnpm() {
  [[ "$DEPS_NO_INSTALL" == true ]] && return 1
  deps_have node && deps_have corepack || return 1
  echo "deps: enabling corepack pnpm@${DEPS_PNPM_VERSION}..."
  corepack enable >/dev/null 2>&1 || true
  corepack prepare "pnpm@${DEPS_PNPM_VERSION}" --activate
}

deps_install_hint() {
  local tool="$1"
  echo "deps: install ${tool}:" >&2
  case "$(uname -s)" in
    Darwin)
      case "$tool" in
        node)   echo "  brew install node" >&2 ;;
        python) echo "  brew install python@3.12" >&2 ;;
        aws)    echo "  brew install awscli" >&2 ;;
        pnpm)   echo "  corepack enable && corepack prepare pnpm@${DEPS_PNPM_VERSION} --activate" >&2 ;;
      esac
      ;;
    Linux)
      echo "  See ${DEPS_SETUP_DOC} (Debian/Ubuntu or Fedora section)" >&2
      case "$tool" in
        pnpm) echo "  corepack enable && corepack prepare pnpm@${DEPS_PNPM_VERSION} --activate" >&2 ;;
        aws)  echo "  sudo apt install awscli  OR  sudo dnf install awscli" >&2 ;;
      esac
      ;;
    *) echo "  See ${DEPS_SETUP_DOC}" >&2 ;;
  esac
}

deps_try_brew_install() {
  local pkg="$1"
  [[ "$DEPS_NO_INSTALL" == true || "$DEPS_ENSURE_MODE" != true ]] && return 1
  deps_have brew || return 1
  echo "deps: brew install ${pkg}..."
  brew install "$pkg"
}

deps_ensure_one() {
  local name="$1"
  local ok=0

  case "$name" in
    node)
      deps_check_node && ok=1
      if [[ $ok -eq 0 ]] && deps_try_brew_install node; then deps_check_node && ok=1; fi
      ;;
    pnpm)
      if deps_check_pnpm; then ok=1
      elif deps_try_corepack_pnpm && deps_check_pnpm; then ok=1
      fi
      ;;
    python)
      deps_check_python && ok=1
      if [[ $ok -eq 0 ]] && deps_try_brew_install python@3.12; then
        deps_brew_path_python
        deps_check_python && ok=1
      fi
      ;;
    aws)
      deps_check_aws_cli && ok=1
      if [[ $ok -eq 0 ]] && deps_try_brew_install awscli; then deps_check_aws_cli && ok=1; fi
      ;;
  esac

  if [[ $ok -eq 1 ]]; then return 0; fi
  echo "deps: missing or invalid: ${name}" >&2
  deps_install_hint "$name"
  return 1
}

# Setup phase 1: install or print commands for node, pnpm, python, aws CLI (binary only).
deps_ensure_prerequisites() {
  DEPS_ENSURE_MODE=true
  local failed=false tools=(node pnpm python)
  [[ "$DEPS_SKIP_AWS_SETUP" != true ]] && tools+=(aws)
  echo "==> Step 1/5: Prerequisites (${DEPS_SETUP_DOC})"
  for tool in "${tools[@]}"; do
    deps_ensure_one "$tool" || failed=true
  done
  DEPS_ENSURE_MODE=false
  if [[ "$failed" == true ]]; then
    echo "deps: install the tools above, then re-run: make setup" >&2
    return 1
  fi
  local py_ver="?"
  if py="$(deps_find_python 2>/dev/null)"; then
    py_ver="$("$py" -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo "?")"
  fi
  local summary="node $(node -v 2>/dev/null), pnpm $(pnpm -v 2>/dev/null), python ${py_ver}"
  if [[ "$DEPS_SKIP_AWS_SETUP" != true ]] && deps_check_aws_cli; then
    summary+=", aws $(aws --version 2>/dev/null | head -1)"
  fi
  echo "    OK: ${summary}"
  return 0
}

# check-deps / refresh: verify only (optional corepack fix).
deps_run_scan() {
  local failed=false
  echo "==> Checking prerequisites (${DEPS_SETUP_DOC})"
  deps_check_node || { echo "deps: missing node 20+ — see ${DEPS_SETUP_DOC}" >&2; failed=true; }
  if ! deps_check_pnpm; then
    deps_try_corepack_pnpm || true
    deps_check_pnpm || { echo "deps: missing pnpm 9.x — see ${DEPS_SETUP_DOC}" >&2; failed=true; }
  fi
  deps_check_python || { echo "deps: missing python 3.10–3.13 — see ${DEPS_SETUP_DOC}" >&2; failed=true; }
  [[ "$failed" == true ]] && return 1
  if [[ "$DEPS_SKIP_AWS" != true ]]; then
    deps_check_aws_cli || { echo "deps: missing aws cli v2" >&2; failed=true; }
  fi
  echo "deps: checks passed"
  return 0
}

deps_parse_flags() {
  DEPS_SKIP_AWS=false
  DEPS_NO_INSTALL=false
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --skip-secrets) DEPS_SKIP_AWS=true ;;
      --no-install) DEPS_NO_INSTALL=true ;;
      --light) DEPS_SKIP_AWS=true ;;
      *) deps_die "Unknown flag: $1" ;;
    esac
    shift
  done
}
