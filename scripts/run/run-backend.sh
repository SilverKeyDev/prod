#!/usr/bin/env bash
# Backend-only script: Redis, Flask, Celery.
# Can be run standalone (./scripts/run/run-backend.sh [--production]) or sourced by run-web.sh.

set -euo pipefail

# =========================
# Path resolution (when executed directly or sourced)
# =========================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=dev_ports.sh
source "${SCRIPT_DIR}/dev_ports.sh"

# =========================
# Colors
# =========================
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =========================
# Config
# =========================
FLASK_PORT="${FLASK_PORT:-5000}"

# =========================
# PIDs (set by start_backend)
# =========================
FLASK_PID=""
CELERY_PID=""
REDIS_PID=""

# =========================
# Logging helpers (stdout/stderr only, no log files)
# =========================
log() {
  echo -e "${BLUE}[$(date +%T)] [run-backend]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +%T)] [run-backend] WARN:${NC} $1" >&2
}

err() {
  echo -e "${RED}[$(date +%T)] [run-backend] ERROR:${NC} $1" >&2
  echo -e "${RED}  Context: ROOT_DIR=$ROOT_DIR FLASK_PORT=$FLASK_PORT SCRIPT_DIR=$SCRIPT_DIR${NC}" >&2
}

# =========================
# Kill processes on backend dev ports (5000, 6379)
# =========================
kill_port_processes_backend() {
  local ports=(5000 6379)
  for port in "${ports[@]}"; do
    log "Checking for processes on port $port..."
    if dev_port_busy "$port"; then
      log "${RED}Killing processes on port $port${NC}"
      dev_kill_tcp_port "$port" || true
      sleep 1
      if dev_port_busy "$port"; then
        warn "Some processes on port $port may still be running"
      else
        log "${GREEN}✅ Port $port is now free${NC}"
      fi
    else
      log "${GREEN}✅ Port $port is already free${NC}"
    fi
  done
}

# =========================
# Cleanup backend processes (call from run-web/run-mobile or when run standalone)
# =========================
cleanup_backend() {
  log "${RED}Cleaning up backend...${NC}"
  if [[ -n "${REDIS_PID}" ]] && ps -p "${REDIS_PID}" >/dev/null 2>&1; then
    redis-cli shutdown >/dev/null 2>&1 || true
  fi
  if [[ -n "${CELERY_PID}" ]]; then kill "${CELERY_PID}" 2>/dev/null || true; fi
  if [[ -n "${FLASK_PID}" ]];  then kill "${FLASK_PID}"  2>/dev/null || true; fi
  if [[ -n "${REDIS_PID}" ]];  then kill "${REDIS_PID}"  2>/dev/null || true; fi
  pkill -P $$ 2>/dev/null || true
  log "${GREEN}Backend processes terminated.${NC}"
}

# =========================
# Run command with timeout (portable: uses timeout/gtimeout if available, else perl)
# =========================
run_with_timeout() {
  local t=$1
  shift
  local timeout_cmd
  if timeout_cmd=$(command -v timeout 2>/dev/null) || timeout_cmd=$(command -v gtimeout 2>/dev/null); then
    "$timeout_cmd" "$t" "$@"
  elif command -v perl >/dev/null 2>&1; then
    perl -e 'my $t=shift; $SIG{ALRM}=sub{exit 124}; alarm $t; my $r=system(@ARGV); alarm 0; exit $r ? ($r>>8) : 0' "$t" "$@"
  else
    warn "Neither timeout/gtimeout nor perl found; running without timeout (may stall)"
    "$@"
  fi
}

# =========================
# Wait helpers
# =========================
wait_for_port() {
  local host="$1" port="$2" retries="${3:-12}" delay="${4:-1}"
  local pid="${5:-}"
  for i in $(seq 1 "$retries"); do
    if [[ -n "$pid" ]] && ! ps -p "$pid" >/dev/null 2>&1; then
      err "Process PID $pid exited before $host:$port was ready. Check Python output above (DB connection, imports, missing env)."
      return 1
    fi
    if nc -z "$host" "$port" 2>/dev/null; then
      log "${GREEN}✅ $host:$port is accepting TCP${NC}"
      return 0
    fi
    log "Waiting for $host:$port... ($i/$retries)"
    sleep "$delay"
  done
  err "Timeout waiting for $host:$port after $retries attempts. Run: lsof -i :$port | head -20"
  return 1
}

wait_for_http() {
  local url="$1" retries="${2:-12}" delay="${3:-1}"
  for i in $(seq 1 "$retries"); do
    if NO_PROXY="localhost,127.0.0.1,::1" curl -4 --noproxy "localhost,127.0.0.1,::1" -fsS "$url" >/dev/null 2>&1; then
      log "${GREEN}✅ $url is ready${NC}"
      return 0
    fi
    log "Waiting for $url... ($i/$retries)"
    sleep "$delay"
  done
  err "Timeout waiting for HTTP $url after $retries attempts. Service may have crashed or be binding to wrong host."
  return 1
}

# =========================
# Start backend: Redis, Flask, Celery.
# Pass --production to run Flask with gunicorn.
# =========================
start_backend() {
  local production=false
  for arg in "$@"; do
    [[ "$arg" == "--production" ]] && production=true && break
  done

  # Load env
  if [[ -f "${ROOT_DIR}/Server/.env" ]]; then
    log "Loading environment variables from Server/.env"
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/Server/.env" || { err "Failed to source Server/.env"; exit 1; }
  else
    log "No Server/.env found (optional); using shell env"
  fi

  log "${RED}Cleaning up existing processes on ports 5000 and 6379...${NC}"
  kill_port_processes_backend

  # Start Redis
  log "[Backend] Starting Redis server..."
  if ! command -v redis-server >/dev/null 2>&1; then
    err "redis-server not found in PATH. Install Redis (e.g. macOS: brew install redis; Debian/Ubuntu: sudo apt install redis-server; Fedora: sudo dnf install redis) or ensure redis-server is on PATH."
    exit 1
  fi
  redis-server --daemonize no --port 6379 &
  REDIS_PID=$!
  log "Redis started (PID ${REDIS_PID}). Waiting for redis-cli ping..."
  local redis_wait=0
  until redis-cli ping >/dev/null 2>&1; do
    sleep 0.25
    redis_wait=$((redis_wait + 1))
    [[ $redis_wait -gt 80 ]] && { err "Redis did not respond to ping within 20s. PID ${REDIS_PID}. Check: redis-cli ping"; exit 1; }
  done
  log "${GREEN}✅ Redis is ready at localhost:6379 (PID ${REDIS_PID})${NC}"

  # Start Flask (dev or prod)
  if [[ "$production" == "true" ]]; then
    log "[Backend] Starting Flask server in ${RED}production${NC} mode (gunicorn @ 0.0.0.0:${FLASK_PORT})..."
    pushd "${ROOT_DIR}/Server" >/dev/null
    if [[ -d ".venv" ]]; then
      source .venv/bin/activate
      gunicorn --preload -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - &
    else
      python3 -m gunicorn --preload -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - &
    fi
    FLASK_PID=$!
    popd >/dev/null
  else
    log "[Backend] Starting Flask server in ${GREEN}development${NC} mode (0.0.0.0:${FLASK_PORT})..."
    pushd "${ROOT_DIR}/Server" >/dev/null
    if [[ -d ".venv" ]]; then
      log "Activating virtual environment..."
      source .venv/bin/activate
      python run.py --host 0.0.0.0 --port "${FLASK_PORT}" &
    else
      python3 run.py --host 0.0.0.0 --port "${FLASK_PORT}" &
    fi
    FLASK_PID=$!
    popd >/dev/null
  fi

  # Wait for Flask (create_app blocks on DB + imports before binding the port)
  log "Waiting for Flask TCP on 127.0.0.1:${FLASK_PORT}..."
  if wait_for_port 127.0.0.1 "${FLASK_PORT}" 60 1 "${FLASK_PID}"; then
    log "${GREEN}✅ Flask TCP is accepting on 127.0.0.1:${FLASK_PORT}${NC}"
  else
    err "Flask did not start accepting TCP on port ${FLASK_PORT} within 60s. create_app() may be blocked on DATABASE_URL (remote RDS needs network/VPN). Check: lsof -i :${FLASK_PORT}; ps aux | grep -E 'flask|python.*run.py'; python -c 'from app import create_app; create_app()' in Server/"
    exit 1
  fi

  log "Waiting for Flask HTTP endpoint on 127.0.0.1:${FLASK_PORT}/healthz..."
  if wait_for_http "http://127.0.0.1:${FLASK_PORT}/healthz" 30 1; then
    log "${GREEN}✅ Flask HTTP endpoint is ready at http://127.0.0.1:${FLASK_PORT}/healthz${NC}"
  else
    warn "Flask did not start responding on http://127.0.0.1:${FLASK_PORT}/healthz within timeout. Trying root URL..."
    if wait_for_http "http://127.0.0.1:${FLASK_PORT}/" 10 1; then
      log "${GREEN}✅ Flask root endpoint is ready at http://127.0.0.1:${FLASK_PORT}/${NC}"
    else
      err "Flask HTTP not responding on port ${FLASK_PORT} (healthz and / both failed). Flask may have crashed on startup (DB, imports, etc). Check Flask process output above."
      exit 1
    fi
  fi

  # Start Celery
  log "[Backend] Starting Celery worker..."
  pushd "${ROOT_DIR}/Server" >/dev/null
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
    celery -A app.celery.celery_worker:celery worker --loglevel=info &
  else
    python3 -m celery -A app.celery.celery_worker:celery worker --loglevel=info &
  fi
  CELERY_PID=$!
  popd >/dev/null
  log "${GREEN}✅ Celery worker started (PID: ${CELERY_PID})${NC}"
}

# =========================
# When executed directly (not sourced): run backend and wait
# =========================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  log "Starting run-backend.sh | ROOT_DIR=$ROOT_DIR | FLASK_PORT=$FLASK_PORT | args=$*"
  cd "$ROOT_DIR" || { err "Failed to cd to ROOT_DIR=$ROOT_DIR"; exit 1; }
  trap 'EXIT_CODE=$?; [[ $EXIT_CODE -ne 0 ]] && err "Script exiting with code $EXIT_CODE"; cleanup_backend; exit $EXIT_CODE' SIGINT SIGTERM EXIT
  start_backend "$@"
  log "Backend started. Waiting on Flask PID ${FLASK_PID}..."
  wait "${FLASK_PID}" || { err "Flask process (PID ${FLASK_PID}) exited unexpectedly"; exit 1; }
fi
