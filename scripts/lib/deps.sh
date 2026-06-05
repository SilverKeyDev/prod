# Prerequisite checks and install helpers for make setup.
# shellcheck shell=bash

DEPS_PNPM_VERSION="${DEPS_PNPM_VERSION:-9.0.0}"
DEPS_SETUP_DOC="${DEPS_SETUP_DOC:-setup.md}"
DEPS_SKIP_AWS=false
DEPS_NO_INSTALL=false
DEPS_ENSURE_MODE=false # true = setup may brew-install missing tools
DEPS_SKIP_AWS_SETUP=false
DEPS_CMD_TIMEOUT="${DEPS_CMD_TIMEOUT:-600}" # seconds for brew/corepack/network installs

deps_die() { echo "deps: $*" >&2; exit 1; }
deps_have() { command -v "$1" >/dev/null 2>&1; }

# Classify the current shell environment so we can fail early with a clear
# explanation instead of letting bash/make/redis/venv steps blow up confusingly.
# Echoes one of: macos | wsl | linux | windows | unknown
deps_detect_platform() {
  local kernel
  kernel="$(uname -s 2>/dev/null || echo unknown)"
  case "$kernel" in
    Darwin) echo macos ;;
    MINGW*|MSYS*|CYGWIN*) echo windows ;;
    Linux)
      # WSL reports Linux but advertises itself in /proc/version and env vars.
      if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]] ||
         grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
        echo wsl
      else
        echo linux
      fi
      ;;
    *) echo unknown ;;
  esac
}

# Print the "why" + exact steps for Windows users who must develop inside WSL2.
deps_print_windows_help() {
  cat >&2 <<'EOF'

============================================================================
  SilverKey setup must run inside WSL2 (Ubuntu), not native Windows.
============================================================================

WHY: The whole dev toolchain is Unix-based — bash setup scripts, GNU make,
a Python venv, Redis, and the libmagic system library. PowerShell, CMD, and
Git Bash cannot run these reliably, which is the confusing errors you hit.
WSL2 gives you a real Ubuntu Linux on Windows where the exact same commands
your macOS/Linux teammates use just work.

ONE-TIME (in an ADMIN PowerShell, then reboot):

  wsl --install               # installs WSL2 + Ubuntu by default
  # reboot, then open "Ubuntu" from the Start menu and create your user

THEN, INSIDE the Ubuntu (WSL) terminal:

  sudo apt update
  sudo apt install -y build-essential git python3 python3-venv \
    redis-server libmagic1 awscli
  # install Node 20+ and pnpm 9 (nvm shown; corepack handles pnpm):
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  exec bash && nvm install 20 && corepack enable

  # IMPORTANT: clone into the Linux home dir (fast + correct), NOT /mnt/c:
  cd ~ && git clone <repo-url> && cd <repo> && make setup

Open the project in Cursor/VS Code with the WSL extension ("Connect to WSL").
Full guide: setup.md → "Windows (WSL2)" section.
============================================================================
EOF
}

# Gate setup on a supported environment. Returns non-zero on native Windows.
deps_assert_supported_platform() {
  local plat
  plat="$(deps_detect_platform)"
  case "$plat" in
    macos) deps_log "Platform: macOS" ;;
    wsl)   deps_log "Platform: WSL2 (${WSL_DISTRO_NAME:-Linux}) — good, this is the supported Windows setup" ;;
    linux) deps_log "Platform: Linux" ;;
    windows)
      echo "deps: native Windows shell detected ($(uname -s 2>/dev/null))" >&2
      deps_print_windows_help
      return 1
      ;;
    *)
      deps_log "Platform: unrecognized ($(uname -s 2>/dev/null)) — proceeding; setup expects macOS, Linux, or WSL2"
      ;;
  esac
  return 0
}

# Avoid Corepack blocking on "about to download" with no visible progress.
deps_init_env() {
  export COREPACK_ENABLE_DOWNLOAD_PROMPT="${COREPACK_ENABLE_DOWNLOAD_PROMPT:-0}"
}

deps_log() {
  echo "    $*"
}

deps_log_step() {
  deps_log "[$1] $2"
}

# Run a command with periodic heartbeat logs so long network/brew steps do not look hung.
deps_run_with_timeout() {
  local secs="$1"
  shift
  local label="${1:-command}"
  shift

  if command -v timeout >/dev/null 2>&1; then
    deps_log_step "$label" "running (timeout ${secs}s): $*"
    if timeout "$secs" "$@"; then
      return 0
    fi
    local rc=$?
    if [[ $rc -eq 124 ]]; then
      echo "deps: timed out after ${secs}s: $*" >&2
    fi
    return "$rc"
  fi

  deps_log_step "$label" "running (up to ${secs}s): $*"
  "$@" &
  local pid=$!
  local waited=0
  local interval=5
  while kill -0 "$pid" 2>/dev/null && [[ $waited -lt $secs ]]; do
    sleep "$interval"
    waited=$((waited + interval))
    if [[ $((waited % 15)) -eq 0 ]]; then
      deps_log "[$label] still running… (${waited}s / ${secs}s)"
    fi
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "deps: timed out after ${secs}s: $*" >&2
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    return 124
  fi
  wait "$pid"
}

deps_node_version() {
  node -v 2>/dev/null | tr -d '\r' || true
}

deps_pnpm_version() {
  # Corepack may download on first pnpm -v; COREPACK_ENABLE_DOWNLOAD_PROMPT=0 avoids prompts.
  pnpm -v 2>/dev/null | head -1 | tr -d '\r' || true
}

deps_check_node() {
  deps_have node && node -e 'process.exit(+process.versions.node.split(".")[0]>=20?0:1)' 2>/dev/null
}

deps_check_pnpm() {
  local ver
  ver="$(deps_pnpm_version)"
  [[ -n "$ver" ]] && [[ "$ver" =~ ^9\. ]]
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

deps_check_redis_binaries() {
  deps_have redis-server && deps_have redis-cli
}

# python-magic (Server) needs the native libmagic library (not installable via pip).
deps_check_libmagic_system() {
  case "$(uname -s)" in
    Darwin)
      if deps_have brew; then
        local prefix
        prefix="$(brew --prefix libmagic 2>/dev/null)" || return 1
        [[ -f "${prefix}/lib/libmagic.dylib" || -f "${prefix}/lib/libmagic.1.dylib" ]]
        return $?
      fi
      [[ -f /opt/homebrew/lib/libmagic.dylib || -f /usr/local/lib/libmagic.dylib ]]
      ;;
    Linux)
      if command -v dpkg-query >/dev/null 2>&1; then
        dpkg-query -W -f='${Status}' libmagic1 2>/dev/null | grep -q 'install ok installed'
        return $?
      fi
      if command -v rpm >/dev/null 2>&1; then
        rpm -q file-libs >/dev/null 2>&1 || rpm -q file >/dev/null 2>&1
        return $?
      fi
      ldconfig -p 2>/dev/null | grep -q 'libmagic\.so'
      ;;
    *) return 1 ;;
  esac
}

deps_check_redis_ping() {
  deps_have redis-cli && redis-cli ping 2>/dev/null | grep -qE '^(PONG|LOADING)'
}

deps_try_start_redis() {
  [[ "$DEPS_NO_INSTALL" == true ]] && return 1
  deps_check_redis_binaries || return 1
  deps_check_redis_ping && return 0
  deps_log_step redis "not responding — starting redis-server (daemonize yes, port 6379)…"
  redis-server --daemonize yes --port 6379 >/dev/null 2>&1 || return 1
  local waited=0
  while ! deps_check_redis_ping && [[ $waited -lt 40 ]]; do
    sleep 0.25
    waited=$((waited + 1))
  done
  deps_check_redis_ping
}

deps_brew_path_python() {
  if [[ -d /opt/homebrew/opt/python@3.12/bin ]]; then
    export PATH="/opt/homebrew/opt/python@3.12/bin:$PATH"
  elif [[ -d /usr/local/opt/python@3.12/bin ]]; then
    export PATH="/usr/local/opt/python@3.12/bin:$PATH"
  fi
}

deps_try_corepack_pnpm() {
  [[ "$DEPS_NO_INSTALL" == true ]] && return 1
  if ! deps_have node; then
    deps_log_step pnpm "skipped corepack (node not found)"
    return 1
  fi
  if ! deps_have corepack; then
    deps_log_step pnpm "skipped corepack (corepack not on PATH; install node with corepack or: brew install corepack)"
    return 1
  fi
  local current
  current="$(deps_pnpm_version)"
  if [[ -n "$current" && "$current" =~ ^9\. ]]; then
    deps_log_step pnpm "already ${current}"
    return 0
  fi
  if [[ -n "$current" ]]; then
    deps_log_step pnpm "found ${current}, need ${DEPS_PNPM_VERSION} (via corepack; first run may download)"
  else
    deps_log_step pnpm "installing pnpm@${DEPS_PNPM_VERSION} via corepack (first run may download)"
  fi
  if ! deps_run_with_timeout "$DEPS_CMD_TIMEOUT" corepack corepack enable; then
    echo "deps: corepack enable failed" >&2
    return 1
  fi
  if ! deps_run_with_timeout "$DEPS_CMD_TIMEOUT" corepack \
    corepack prepare "pnpm@${DEPS_PNPM_VERSION}" --activate; then
    echo "deps: corepack prepare pnpm@${DEPS_PNPM_VERSION} failed" >&2
    return 1
  fi
  deps_log_step pnpm "corepack activate done ($(deps_pnpm_version || echo '?'))"
  return 0
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
        redis)    echo "  brew install redis && brew services start redis" >&2 ;;
        libmagic) echo "  brew install libmagic" >&2 ;;
        pnpm)     echo "  corepack enable && corepack prepare pnpm@${DEPS_PNPM_VERSION} --activate" >&2 ;;
      esac
      ;;
    Linux)
      echo "  See ${DEPS_SETUP_DOC} (Debian/Ubuntu or Fedora section)" >&2
      case "$tool" in
        pnpm) echo "  corepack enable && corepack prepare pnpm@${DEPS_PNPM_VERSION} --activate" >&2 ;;
        aws)  echo "  sudo apt install awscli  OR  sudo dnf install awscli" >&2 ;;
        redis)    echo "  sudo apt install redis-server  OR  sudo dnf install redis" >&2 ;;
        libmagic) echo "  sudo apt install libmagic1  OR  sudo dnf install file-libs" >&2 ;;
      esac
      ;;
    *) echo "  See ${DEPS_SETUP_DOC}" >&2 ;;
  esac
}

deps_try_brew_install() {
  local pkg="$1"
  [[ "$DEPS_NO_INSTALL" == true || "$DEPS_ENSURE_MODE" != true ]] && return 1
  deps_have brew || return 1
  deps_log_step brew "install ${pkg} (Homebrew auto-update disabled for speed)"
  if ! HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_ENV_HINTS=1 \
    deps_run_with_timeout "$DEPS_CMD_TIMEOUT" brew brew install "$pkg"; then
    echo "deps: brew install ${pkg} failed" >&2
    return 1
  fi
  return 0
}

deps_ensure_one() {
  local name="$1"
  local ok=0

  deps_log_step "$name" "checking…"

  case "$name" in
    node)
      if deps_check_node; then
        ok=1
        deps_log_step node "OK $(deps_node_version)"
      elif deps_try_brew_install node && deps_check_node; then
        ok=1
        deps_log_step node "OK $(deps_node_version) (installed via brew)"
      fi
      ;;
    pnpm)
      if deps_check_pnpm; then
        ok=1
        deps_log_step pnpm "OK $(deps_pnpm_version)"
      elif deps_try_corepack_pnpm && deps_check_pnpm; then
        ok=1
        deps_log_step pnpm "OK $(deps_pnpm_version) (via corepack)"
      else
        local ver
        ver="$(deps_pnpm_version)"
        if [[ -n "$ver" ]]; then
          deps_log_step pnpm "found ${ver} but need 9.x"
        fi
      fi
      ;;
    python)
      if deps_check_python; then
        ok=1
        local py ver
        py="$(deps_find_python)"
        ver="$("$py" -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo "?")"
        deps_log_step python "OK ${ver} (${py})"
      elif deps_try_brew_install python@3.12; then
        deps_brew_path_python
        if deps_check_python; then
          ok=1
          local py ver
          py="$(deps_find_python)"
          ver="$("$py" -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo "?")"
          deps_log_step python "OK ${ver} (${py}, installed via brew)"
        fi
      fi
      ;;
    aws)
      if deps_check_aws_cli; then
        ok=1
        deps_log_step aws "OK $(aws --version 2>/dev/null | head -1)"
      elif deps_try_brew_install awscli && deps_check_aws_cli; then
        ok=1
        deps_log_step aws "OK $(aws --version 2>/dev/null | head -1) (installed via brew)"
      fi
      ;;
    redis)
      if deps_check_redis_ping; then
        ok=1
        deps_log_step redis "OK (redis-cli ping → PONG)"
      elif deps_check_redis_binaries && deps_try_start_redis; then
        ok=1
        deps_log_step redis "OK (started redis-server, redis-cli ping → PONG)"
      elif deps_try_brew_install redis; then
        deps_try_start_redis || true
        if deps_check_redis_ping; then
          ok=1
          deps_log_step redis "OK (installed via brew, redis-cli ping → PONG)"
        fi
      fi
      if [[ $ok -ne 1 ]] && deps_check_redis_binaries; then
        deps_log_step redis "binaries found but not responding — try: brew services start redis  OR  redis-server --daemonize yes"
      fi
      ;;
    libmagic)
      if deps_check_libmagic_system; then
        ok=1
        deps_log_step libmagic "OK (system library)"
      elif deps_try_brew_install libmagic && deps_check_libmagic_system; then
        ok=1
        deps_log_step libmagic "OK (installed via brew)"
      fi
      ;;
  esac

  if [[ $ok -eq 1 ]]; then return 0; fi
  echo "deps: missing or invalid: ${name}" >&2
  deps_install_hint "$name"
  return 1
}

# Setup phase 1: install or print commands for node, pnpm, python, aws CLI (binary only).
deps_ensure_prerequisites() {
  deps_init_env
  if ! deps_assert_supported_platform; then
    return 1
  fi
  DEPS_ENSURE_MODE=true
  local failed=false tools=(node pnpm python redis libmagic)
  [[ "$DEPS_SKIP_AWS_SETUP" != true ]] && tools+=(aws)
  echo "==> Step 1/5: Prerequisites (${DEPS_SETUP_DOC})"
  deps_log "Checking: ${tools[*]} (install hints in ${DEPS_SETUP_DOC})"
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
  local summary="node $(deps_node_version), pnpm $(deps_pnpm_version), python ${py_ver}"
  if [[ "$DEPS_SKIP_AWS_SETUP" != true ]] && deps_check_aws_cli; then
    summary+=", aws $(aws --version 2>/dev/null | head -1)"
  fi
  if deps_check_redis_ping; then
    summary+=", redis (PONG)"
  elif deps_check_redis_binaries; then
    summary+=", redis (installed, not running)"
  fi
  if deps_check_libmagic_system; then
    summary+=", libmagic"
  fi
  echo "    OK: ${summary}"
  return 0
}

# check-deps / refresh: verify only (optional corepack fix).
deps_run_scan() {
  deps_init_env
  local failed=false
  echo "==> Checking prerequisites (${DEPS_SETUP_DOC})"
  if ! deps_assert_supported_platform; then
    return 1
  fi
  deps_log_step node "checking…"
  if deps_check_node; then
    deps_log_step node "OK $(deps_node_version)"
  else
    echo "deps: missing node 20+ — see ${DEPS_SETUP_DOC}" >&2
    failed=true
  fi
  deps_log_step pnpm "checking…"
  if ! deps_check_pnpm; then
    local ver
    ver="$(deps_pnpm_version)"
    [[ -n "$ver" ]] && deps_log_step pnpm "found ${ver}, need 9.x — trying corepack…"
    deps_try_corepack_pnpm || true
    if deps_check_pnpm; then
      deps_log_step pnpm "OK $(deps_pnpm_version)"
    else
      echo "deps: missing pnpm 9.x — see ${DEPS_SETUP_DOC}" >&2
      failed=true
    fi
  else
    deps_log_step pnpm "OK $(deps_pnpm_version)"
  fi
  deps_log_step python "checking…"
  if deps_check_python; then
    local py ver
    py="$(deps_find_python)"
    ver="$("$py" -c 'import sys; print("%s.%s" % sys.version_info[:2])' 2>/dev/null || echo "?")"
    deps_log_step python "OK ${ver}"
  else
    echo "deps: missing python 3.10–3.13 — see ${DEPS_SETUP_DOC}" >&2
    failed=true
  fi
  deps_log_step redis "checking…"
  if deps_check_redis_ping; then
    deps_log_step redis "OK (PONG)"
  elif deps_check_redis_binaries && deps_try_start_redis; then
    deps_log_step redis "OK (started redis-server, redis-cli ping → PONG)"
  elif deps_check_redis_binaries; then
    deps_log_step redis "installed but not running — try: brew services start redis  OR  redis-server --daemonize yes"
    failed=true
  else
    echo "deps: missing redis-server / redis-cli — see ${DEPS_SETUP_DOC}" >&2
    failed=true
  fi
  deps_log_step libmagic "checking…"
  if deps_check_libmagic_system; then
    deps_log_step libmagic "OK (system library)"
  else
    echo "deps: missing libmagic (required by python-magic for secure uploads) — see ${DEPS_SETUP_DOC}" >&2
    deps_install_hint libmagic
    failed=true
  fi
  [[ "$failed" == true ]] && return 1
  if [[ "$DEPS_SKIP_AWS" != true ]]; then
    deps_log_step aws "checking…"
    if deps_check_aws_cli; then
      deps_log_step aws "OK"
    else
      echo "deps: missing aws cli v2" >&2
      failed=true
    fi
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

# Initialize Corepack defaults when this library is sourced.
deps_init_env
