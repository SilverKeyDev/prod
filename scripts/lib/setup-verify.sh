# Post-setup smoke checks. Source from scripts/setup/setup-local.sh.
# shellcheck shell=bash

setup_verify_fail() {
  echo "setup-verify: FAIL — $*" >&2
  return 1
}

setup_verify_ok() {
  echo "setup-verify: OK — $*"
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
  case "$url" in
    *localhost*|*127.0.0.1*|*::1*|*silverkey-dev-postgres*|*postgres:5432*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

setup_verify_env_file() {
  local root="$1" env_file="${root}/Server/.env"
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
  if ! setup_verify_is_local_database_url "$database_url" && [[ "${ALLOW_SHARED_DATABASE_URL:-0}" != "1" ]]; then
    setup_verify_fail "DATABASE_URL points at a non-local DB. Use make db-up + make secrets for local dev, or set ALLOW_SHARED_DATABASE_URL=1 intentionally."
    return 1
  fi

  if setup_verify_is_local_database_url "$database_url"; then
    setup_verify_ok "Server/.env has local DATABASE_URL and JWT_SIGNING_SECRET"
  else
    setup_verify_ok "Server/.env has DATABASE_URL and JWT_SIGNING_SECRET (shared DB override enabled)"
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

setup_verify_all() {
  local root="$1" skip_aws="${2:-false}"
  local failed=false
  echo "==> Verifying setup"

  setup_verify_client "$root" || failed=true
  setup_verify_server_venv "$root" || failed=true
  setup_verify_libmagic "$root" || failed=true
  setup_verify_redis || failed=true
  if [[ "$skip_aws" != true ]]; then
    setup_verify_env_file "$root" || failed=true
    setup_verify_aws "$root" || failed=true
  else
    setup_verify_ok "skipped Server/.env and AWS checks (--skip-secrets)"
  fi

  if [[ "$failed" == true ]]; then
    echo "setup-verify: one or more checks failed — see messages above" >&2
    return 1
  fi
  echo "setup-verify: all checks passed — try: make dev"
  return 0
}
