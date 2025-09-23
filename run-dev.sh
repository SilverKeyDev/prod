#!/usr/bin/env bash

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
# If you don't have /healthz, we'll fall back to a port probe on 5000.
FLASK_PORT="${FLASK_PORT:-5000}"

# =========================
# PIDs
# =========================
FLASK_PID=""
VITE_PID=""
CELERY_PID=""
REDIS_PID=""
TC_WATCH_PID=""

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
# Kill processes on common dev ports
# =========================
kill_port_processes() {
  local ports=(5000 5173 6379)
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
# Cleanup on exit
# =========================
cleanup() {
  log "${RED}Cleaning up...${NC}"
  # Try graceful Redis shutdown first
  if [[ -n "${REDIS_PID}" ]] && ps -p "${REDIS_PID}" >/dev/null 2>&1; then
    redis-cli shutdown >/dev/null 2>&1 || true
  fi
  # Kill children we started
  if [[ -n "${CELERY_PID}" ]]; then kill "${CELERY_PID}" 2>/dev/null || true; fi
  if [[ -n "${VITE_PID}" ]];   then kill "${VITE_PID}"   2>/dev/null || true; fi
  if [[ -n "${FLASK_PID}" ]];  then kill "${FLASK_PID}"  2>/dev/null || true; fi
  if [[ -n "${TC_WATCH_PID}" ]]; then kill "${TC_WATCH_PID}" 2>/dev/null || true; fi

  # Also nuke any remaining children of this script
  pkill -P $$ 2>/dev/null || true

  log "${GREEN}All processes terminated.${NC}"
}

trap cleanup SIGINT SIGTERM EXIT

# =========================
# Wait helpers
# =========================
wait_for_port() {
  local host="$1" port="$2" retries="${3:-30}" delay="${4:-1}"
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
  local url="$1" retries="${2:-30}" delay="${3:-1}"
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
# Load env
# =========================
if [[ -f Server/.env ]]; then
  log "Loading environment variables from Server/.env"
  # shellcheck disable=SC1091
  source Server/.env
fi

# =========================
# Prep
# =========================
log "${RED}Cleaning up existing processes on ports 5000, 5173, and 6379...${NC}"
kill_port_processes

# =========================
# Start Redis
# =========================
log "Starting Redis server..."
redis-server --daemonize no --port 6379 >/dev/null 2>&1 &
REDIS_PID=$!
log "Waiting for Redis to start on localhost:6379..."
until redis-cli ping >/dev/null 2>&1; do sleep 0.25; done
log "${GREEN}✅ Redis is ready at localhost:6379${NC}"

# =========================
# Preflight TypeScript typecheck (fail fast)
# =========================
log "Running TypeScript preflight check..."
pushd Client >/dev/null
if npm run -s typecheck >/dev/null 2>&1; then
  log "${GREEN}✅ TypeScript preflight passed${NC}"
else
  warn "❌ TypeScript preflight failed. Fix type errors and re-run."
  popd >/dev/null
  exit 1
fi
popd >/dev/null

# =========================
# Start Flask (dev or prod)
# =========================
if [[ "${1:-}" == "--production" ]]; then
  log "Starting Flask server in ${RED}production${NC} mode (gunicorn @ 0.0.0.0:${FLASK_PORT})..."
  pushd Server >/dev/null
  # Bind gunicorn to 5000 for consistency with dev/proxy
  gunicorn -w 4 -b "0.0.0.0:${FLASK_PORT}" run:app --access-logfile - --error-logfile - >/dev/null 2>&1 &
  FLASK_PID=$!
  popd >/dev/null
else
  log "Starting Flask server in ${GREEN}development${NC} mode (0.0.0.0:${FLASK_PORT})..."
  pushd Server >/dev/null
  python run.py --host 0.0.0.0 --port "${FLASK_PORT}" &
  FLASK_PID=$!
  popd >/dev/null
fi

# =========================
# Wait for Flask to be ready before proceeding
# =========================
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

# =========================
# Start Celery (after Flask so app context is ready)
# =========================
log "Starting Celery worker..."
pushd Server >/dev/null
celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
CELERY_PID=$!
popd >/dev/null
log "${GREEN}✅ Celery worker started (PID: ${CELERY_PID})${NC}"

# =========================
# Start Vite (dev only)
# =========================
if [[ "${1:-}" != "--production" ]]; then
  log "Starting Vite client..."
  pushd Client >/dev/null
  npm run dev &
  VITE_PID=$!

  # Start background TypeScript watch so type errors are surfaced continuously
  npm run -s typecheck:watch >/dev/null 2>&1 &
  TC_WATCH_PID=$!
  popd >/dev/null

  log "Waiting for Vite TCP on localhost:5173..."
  if wait_for_port localhost 5173 30 1; then
    log "${GREEN}✅ Vite TCP is accepting on localhost:5173${NC}"
  else
    warn "Vite did not start accepting TCP on port 5173 within timeout. Exiting."
    exit 1
  fi
else
  log "Production mode: skipping Vite dev server."
fi

# =========================
# Keep script in foreground
# =========================
# Wait for Flask; CTRL+C will trigger cleanup()
wait "${FLASK_PID}"