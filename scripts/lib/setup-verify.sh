# Post-setup smoke checks. Source from scripts/setup/setup-local.sh and setup-dev.sh.
# shellcheck shell=bash

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=secrets-database-url.sh
source "${_LIB_DIR}/secrets-database-url.sh"

setup_verify_fail() {
  echo "setup-verify: FAIL — $*" >&2
  return 1
}

setup_verify_ok() {
  echo "setup-verify: OK — $*"
}

setup_verify_warn() {
  echo "setup-verify: WARN — $*" >&2
}

setup_verify_env_value() {
  local key="$1" file="$2" line val
  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  [[ -n "$line" ]] || return 0
  val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  printf '%s' "$val"
}

setup_verify_is_local_database_url() {
  local url="$1"
  secrets_is_local_database_url "$url"
}

setup_verify_env_file() {
  local root="$1"
  local env_file="${root}/Server/.env"
  [[ -f "$env_file" ]] || { setup_verify_fail "Server/.env missing (secrets step did not run?)"; return 1; }

  local key line val
  for key in DATABASE_URL JWT_SIGNING_SECRET; do
    line="$(grep -E "^${key}=" "$env_file" | tail -1 || true)"
    [[ -n "$line" ]] || { setup_verify_fail "${key} missing from Server/.env"; return 1; }
    val="${line#*=}"
    val="${val%\"}"
    val="${val#\"}"
    [[ -n "$val" ]] || { setup_verify_fail "${key} is empty in Server/.env"; return 1; }
  done

  local database_url
  database_url="$(setup_verify_env_value DATABASE_URL "$env_file")"
  if setup_verify_is_local_database_url "$database_url"; then
    setup_verify_ok "Server/.env has local DATABASE_URL and JWT_SIGNING_SECRET"
  else
    setup_verify_ok "Server/.env has remote DATABASE_URL (Secrets Manager) and JWT_SIGNING_SECRET"
  fi
}

setup_verify_server_venv() {
  local root="$1" venv="${root}/Server/.venv/bin/python"
  [[ -x "$venv" ]] || { setup_verify_fail "Server/.venv not found"; return 1; }
  if ! "$venv" -c 'import flask, sqlalchemy' 2>/dev/null; then
    setup_verify_fail "Python venv import check failed (flask/sqlalchemy)"
    return 1
  fi
  setup_verify_ok "Server/.venv imports (flask, sqlalchemy)"
}

setup_verify_libmagic() {
  local root="$1" venv="${root}/Server/.venv/bin/python"
  [[ -x "$venv" ]] || { setup_verify_fail "Server/.venv not found (cannot verify libmagic)"; return 1; }
  if ! "$venv" -c 'import magic; magic.Magic(mime=True)' 2>/dev/null; then
    setup_verify_fail "python-magic cannot load libmagic — macOS: brew install libmagic; Debian/Ubuntu: sudo apt install libmagic1"
    return 1
  fi
  setup_verify_ok "python-magic loads libmagic (secure uploads)"
}

setup_verify_client() {
  local root="$1"
  [[ -d "${root}/Client/node_modules" ]] || { setup_verify_fail "Client/node_modules missing — pnpm install may have failed"; return 1; }
  if ! (cd "${root}/Client" && pnpm list --depth=0 >/dev/null 2>&1); then
    setup_verify_fail "Client pnpm workspace looks incomplete"
    return 1
  fi
  setup_verify_ok "Client dependencies installed"
}

setup_verify_redis() {
  if redis-cli ping 2>/dev/null | grep -qE '^(PONG|LOADING)'; then
    setup_verify_ok "Redis responds to ping (localhost:6379)"
    return 0
  fi
  if [[ "${SETUP_REQUIRE_REDIS:-0}" == "1" ]]; then
    if command -v redis-server >/dev/null 2>&1 && command -v redis-cli >/dev/null 2>&1; then
      if declare -F deps_try_start_redis >/dev/null 2>&1 && deps_try_start_redis; then
        setup_verify_ok "Redis started (localhost:6379, redis-cli ping → PONG)"
        return 0
      fi
      setup_verify_fail "Redis installed but not running — brew services start redis  OR  redis-server --daemonize yes"
    else
      setup_verify_fail "redis-server not found — see setup.md (brew install redis / apt install redis-server)"
    fi
    return 1
  fi
  setup_verify_warn "Redis not reachable — skipped (backend-only; set SETUP_REQUIRE_REDIS=1 to enforce)"
  return 0
}

setup_verify_aws() {
  local root="$1" region="${AWS_REGION:-us-east-2}"
  [[ -n "${AWS_PROFILE:-}" ]] || {
    setup_verify_fail "AWS_PROFILE not set — run: aws sso login --profile <name> (see setup.md)"
    return 1
  }
  local -a cmd=(aws sts get-caller-identity --region "$region" --output text --query Account)
  [[ -n "${AWS_PROFILE:-}" ]] && cmd+=(--profile "$AWS_PROFILE")
  local acct
  if ! acct="$("${cmd[@]}" 2>&1)"; then
    setup_verify_fail "AWS session: ${acct}"
    return 1
  fi
  setup_verify_ok "AWS session (account ${acct})"
}

setup_verify_core() {
  local root="$1"
  local failed=false
  echo "==> Verifying core setup"

  setup_verify_client "$root" || failed=true
  setup_verify_server_venv "$root" || failed=true
  setup_verify_libmagic "$root" || failed=true
  setup_verify_redis || failed=true

  if [[ "$failed" == true ]]; then
    echo "setup-verify: one or more core checks failed — see messages above" >&2
    return 1
  fi
  echo "setup-verify: core checks passed — try: make dev-web  (full stack: make setup-dev then make dev)"
  return 0
}

setup_verify_backend() {
  local root="$1"
  local failed=false
  echo "==> Verifying backend setup"

  setup_verify_env_file "$root" || failed=true
  setup_verify_aws "$root" || failed=true
  setup_verify_redis || failed=true

  if [[ "$failed" == true ]]; then
    echo "setup-verify: one or more backend checks failed — see messages above" >&2
    return 1
  fi
  echo "setup-verify: backend checks passed — try: make dev"
  return 0
}

setup_verify_all() {
  local root="$1"
  local failed=false

  setup_verify_core "$root" || failed=true
  setup_verify_backend "$root" || failed=true

  if [[ "$failed" == true ]]; then
    echo "setup-verify: one or more checks failed — see messages above" >&2
    return 1
  fi
  echo "setup-verify: all checks passed — try: make dev"
  return 0
}
