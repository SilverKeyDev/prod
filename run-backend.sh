#!/usr/bin/env bash
# Backend-only script: Redis, Flask, Celery.
# Can be run standalone (./run-backend.sh [--production]) or sourced by run-web.sh / run-mobile.sh.

set -euo pipefail

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
# Logging helpers
# =========================
log() {
  echo -e "${BLUE}[$(date +%T)]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +%T)] WARN:${NC} $1"
}

# =========================
# Kill processes on backend dev ports (5000, 6379)
# =========================
kill_port_processes_backend() {
  local ports=(5000 6379)
  for port in "${ports[@]}"; do
    log "Checking for processes on port $port..."
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      log "${RED}Killing processes on port $port: ${pids}${NC}"
      echo "${pids}" | xargs kill -9 2>/dev/null || true
      sleep 1
      local remaining
      remaining=$(lsof -ti:"$port" 2>/dev/null || true)
      if [[ -n "${remaining}" ]]; then
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
# Wait helpers
# =========================
wait_for_port() {
  local host="$1" port="$2" retries="${3:-12}" delay="${4:-1}"
  for i in $(seq 1 "$retries"); do
    if nc -z "$host" "$port" 2>/dev/null; then
      log "${GREEN}✅ $host:$port is accepting TCP${NC}"
      return 0
    fi
    log "Waiting for $host:$port... ($i/$retries)"
    sleep "$delay"
  done
  warn "❌ Timeout waiting for $host:$port"
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
  warn "❌ Timeout waiting for $url"
  return 1
}

# =========================
# Start backend: Redis, Flask, Celery.
# Optional: set LOG_DIR to send Redis/Flask/Celery logs to files (e.g. run-mobile).
# Pass --production to run Flask with gunicorn.
# =========================
start_backend() {
  local production=false
  for arg in "$@"; do
    [[ "$arg" == "--production" ]] && production=true && break
  done

  # Load env
  if [[ -f Server/.env ]]; then
    log "Loading environment variables from Server/.env"
    # shellcheck disable=SC1091
    source Server/.env
  fi

  log "${RED}Cleaning up existing processes on ports 5000 and 6379...${NC}"
  kill_port_processes_backend

  # Start Redis
  log "Starting Redis server..."
  if [[ -n "${LOG_DIR:-}" ]]; then
    redis-server --daemonize no --port 6379 >>"${LOG_DIR}/redis.log" 2>&1 &
  else
    redis-server --daemonize no --port 6379 >/dev/null 2>&1 &
  fi
  REDIS_PID=$!
  log "Waiting for Redis to start on localhost:6379..."
  until redis-cli ping >/dev/null 2>&1; do sleep 0.25; done
  log "${GREEN}✅ Redis is ready at localhost:6379${NC}"

  # Start Flask (dev or prod)
  if [[ "$production" == "true" ]]; then
    log "Starting Flask server in ${RED}production${NC} mode (gunicorn @ 0.0.0.0:${FLASK_PORT})..."
    pushd Server >/dev/null
    if [[ -d ".venv" ]]; then
      source .venv/bin/activate
      if [[ -n "${LOG_DIR:-}" ]]; then
        gunicorn -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - >>"${LOG_DIR}/flask.log" 2>&1 &
      else
        gunicorn -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - >/dev/null 2>&1 &
      fi
    else
      if [[ -n "${LOG_DIR:-}" ]]; then
        python3 -m gunicorn -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - >>"${LOG_DIR}/flask.log" 2>&1 &
      else
        python3 -m gunicorn -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - >/dev/null 2>&1 &
      fi
    fi
    FLASK_PID=$!
    popd >/dev/null
  else
    log "Starting Flask server in ${GREEN}development${NC} mode (0.0.0.0:${FLASK_PORT})..."
    pushd Server >/dev/null
    if [[ -d ".venv" ]]; then
      log "Activating virtual environment..."
      source .venv/bin/activate
      if [[ -n "${LOG_DIR:-}" ]]; then
        python run.py --host 0.0.0.0 --port "${FLASK_PORT}" >>"${LOG_DIR}/flask.log" 2>&1 &
      else
        python run.py --host 0.0.0.0 --port "${FLASK_PORT}" &
      fi
    else
      if [[ -n "${LOG_DIR:-}" ]]; then
        python3 run.py --host 0.0.0.0 --port "${FLASK_PORT}" >>"${LOG_DIR}/flask.log" 2>&1 &
      else
        python3 run.py --host 0.0.0.0 --port "${FLASK_PORT}" &
      fi
    fi
    FLASK_PID=$!
    popd >/dev/null
  fi

  # Wait for Flask
  log "Waiting for Flask TCP on 127.0.0.1:${FLASK_PORT}..."
  if wait_for_port 127.0.0.1 "${FLASK_PORT}" 30 1; then
    log "${GREEN}✅ Flask TCP is accepting on 127.0.0.1:${FLASK_PORT}${NC}"
  else
    warn "Flask did not start accepting TCP on port ${FLASK_PORT} within timeout. Exiting."
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
      warn "Flask did not start responding on port ${FLASK_PORT} within timeout. Exiting."
      exit 1
    fi
  fi

  # Start Celery
  log "Starting Celery worker..."
  pushd Server >/dev/null
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
    if [[ -n "${LOG_DIR:-}" ]]; then
      celery -A app.celery.celery_worker:celery worker --loglevel=info >>"${LOG_DIR}/celery.log" 2>&1 &
    else
      celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
    fi
  else
    if [[ -n "${LOG_DIR:-}" ]]; then
      python3 -m celery -A app.celery.celery_worker:celery worker --loglevel=info >>"${LOG_DIR}/celery.log" 2>&1 &
    else
      python3 -m celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
    fi
  fi
  CELERY_PID=$!
  popd >/dev/null
  log "${GREEN}✅ Celery worker started (PID: ${CELERY_PID})${NC}"
}

# =========================
# When executed directly (not sourced): run backend and wait
# =========================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
  cd "$ROOT_DIR"
  trap cleanup_backend SIGINT SIGTERM EXIT
  start_backend "$@"
  wait "${FLASK_PID}"
fi
