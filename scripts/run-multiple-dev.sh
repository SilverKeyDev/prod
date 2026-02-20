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
# Number of simultaneous server instances to run
INSTANCE_COUNT="${INSTANCE_COUNT:-2}"

# Base ports (will be incremented for each instance)
# If INSTANCE_COUNT=1, respect FLASK_PORT for compatibility with run-dev.sh
if [[ "${INSTANCE_COUNT}" == "1" ]] && [[ -n "${FLASK_PORT:-}" ]]; then
  BASE_FLASK_PORT="${FLASK_PORT}"
else
  BASE_FLASK_PORT="${BASE_FLASK_PORT:-5000}"
fi
BASE_VITE_PORT="${BASE_VITE_PORT:-5173}"

# =========================
# PIDs (arrays to track multiple instances)
# =========================
declare -a FLASK_PIDS=()
declare -a VITE_PIDS=()
declare -a CELERY_PIDS=()
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
# Kill processes on ports
# =========================
kill_port_processes() {
  local ports=()
  # Single Flask server port
  ports+=(${BASE_FLASK_PORT})
  # Multiple Vite ports (one per instance)
  for ((i=0; i<INSTANCE_COUNT; i++)); do
    ports+=($((BASE_VITE_PORT + i)))
  done
  ports+=(6379)  # Redis port

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
  # Kill all Flask instances
  for pid in "${FLASK_PIDS[@]}"; do
    if [[ -n "${pid}" ]]; then kill "${pid}" 2>/dev/null || true; fi
  done
  # Kill all Celery instances
  for pid in "${CELERY_PIDS[@]}"; do
    if [[ -n "${pid}" ]]; then kill "${pid}" 2>/dev/null || true; fi
  done
  # Kill all Vite instances
  for pid in "${VITE_PIDS[@]}"; do
    if [[ -n "${pid}" ]]; then kill "${pid}" 2>/dev/null || true; fi
  done
  # Kill TypeScript watch
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
  local host="$1" port="$2" retries="${3:-12}" delay="${4:-1}"
  local attempt
  for attempt in $(seq 1 "$retries"); do
    if nc -z "$host" "$port" 2>/dev/null; then
      log "${GREEN}✅ $host:$port is accepting TCP${NC}"
      return 0
    fi
    log "Waiting for $host:$port... ($attempt/$retries)"
    sleep "$delay"
  done
  warn "❌ Timeout waiting for $host:$port"
  return 1
}

wait_for_http() {
  local url="$1" retries="${2:-12}" delay="${3:-1}"
  local attempt
  for attempt in $(seq 1 "$retries"); do
    if NO_PROXY="localhost,127.0.0.1,::1" curl -4 --noproxy "localhost,127.0.0.1,::1" -fsS "$url" >/dev/null 2>&1; then
      log "${GREEN}✅ $url is ready${NC}"
      return 0
    fi
    log "Waiting for $url... ($attempt/$retries)"
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
log "${RED}Cleaning up existing processes on ports...${NC}"
kill_port_processes

# =========================
# Start Redis (shared across all instances)
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
# Start Flask server (single instance, shared by all Vite instances)
# =========================
log "Starting Flask server (shared by all ${INSTANCE_COUNT} Vite instance(s))..."

if [[ "${1:-}" == "--production" ]]; then
  log "Starting Flask server in ${RED}production${NC} mode (gunicorn @ 0.0.0.0:${BASE_FLASK_PORT})..."
  pushd Server >/dev/null
  # Activate virtual environment if it exists, otherwise use python3
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
    gunicorn -w 4 -b "0.0.0.0:${BASE_FLASK_PORT}" run:app --access-logfile - --error-logfile - >/dev/null 2>&1 &
  else
    python3 -m gunicorn -w 4 -b "0.0.0.0:${BASE_FLASK_PORT}" run:app --access-logfile - --error-logfile - >/dev/null 2>&1 &
  fi
  FLASK_PIDS+=($!)
  popd >/dev/null
else
  log "Starting Flask server in ${GREEN}development${NC} mode (0.0.0.0:${BASE_FLASK_PORT})..."
  pushd Server >/dev/null
  # Activate virtual environment if it exists, otherwise use python3
  if [[ -d ".venv" ]]; then
    log "Activating virtual environment..."
    source .venv/bin/activate
    python run.py --host 0.0.0.0 --port "${BASE_FLASK_PORT}" &
  else
    python3 run.py --host 0.0.0.0 --port "${BASE_FLASK_PORT}" &
  fi
  FLASK_PIDS+=($!)
  popd >/dev/null
fi

# =========================
# Wait for Flask server to be ready
# =========================
log "Waiting for Flask TCP on 127.0.0.1:${BASE_FLASK_PORT}..."
if wait_for_port 127.0.0.1 "${BASE_FLASK_PORT}" 30 1; then
  log "${GREEN}✅ Flask TCP is accepting on 127.0.0.1:${BASE_FLASK_PORT}${NC}"
else
  warn "Flask did not start accepting TCP on port ${BASE_FLASK_PORT} within timeout. Exiting."
  exit 1
fi

log "Waiting for Flask HTTP endpoint on 127.0.0.1:${BASE_FLASK_PORT}/healthz..."
if wait_for_http "http://127.0.0.1:${BASE_FLASK_PORT}/healthz" 30 1; then
  log "${GREEN}✅ Flask HTTP endpoint is ready at http://127.0.0.1:${BASE_FLASK_PORT}/healthz${NC}"
else
  warn "Flask did not start responding on http://127.0.0.1:${BASE_FLASK_PORT}/healthz within timeout. Trying root URL..."
  if wait_for_http "http://127.0.0.1:${BASE_FLASK_PORT}/" 10 1; then
    log "${GREEN}✅ Flask root endpoint is ready at http://127.0.0.1:${BASE_FLASK_PORT}/${NC}"
  else
    warn "Flask did not start responding on port ${BASE_FLASK_PORT} within timeout. Exiting."
    exit 1
  fi
fi

# =========================
# Start Celery worker (shared)
# =========================
log "Starting Celery worker..."
pushd Server >/dev/null
# Activate virtual environment if it exists, otherwise use python3
if [[ -d ".venv" ]]; then
  source .venv/bin/activate
  celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
else
  python3 -m celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
fi
CELERY_PIDS+=($!)
popd >/dev/null
log "${GREEN}✅ Celery worker started (PID: ${CELERY_PIDS[0]})${NC}"

# Uncomment below if you want one Celery worker per Flask instance:
# for ((i=0; i<INSTANCE_COUNT; i++)); do
#   log "Starting Celery worker #$((i+1))..."
#   pushd Server >/dev/null
#   if [[ -d ".venv" ]]; then
#     source .venv/bin/activate
#     celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
#   else
#     python3 -m celery -A app.celery.celery_worker:celery worker --loglevel=info >/dev/null 2>&1 &
#   fi
#   CELERY_PIDS+=($!)
#   popd >/dev/null
#   log "${GREEN}✅ Celery worker #$((i+1)) started (PID: ${CELERY_PIDS[$i]})${NC}"
# done

# =========================
# Start Vite instances (dev only)
# =========================
if [[ "${1:-}" != "--production" ]]; then
  log "Starting ${INSTANCE_COUNT} Vite client instance(s)..."
  for ((i=0; i<INSTANCE_COUNT; i++)); do
    vite_port=$((BASE_VITE_PORT + i))

    log "Starting Vite client #$((i+1)) on port ${vite_port} (proxying to Flask on port ${BASE_FLASK_PORT})..."
    pushd Client >/dev/null
    # Set environment variables for proxy target and port
    # All Vite instances proxy to the same Flask server (BASE_FLASK_PORT)
    # For single instance with default ports, use same command as run-dev.sh for exact compatibility
    # For multiple instances or custom ports, use exec vite with port override
    if [[ "${INSTANCE_COUNT}" == "1" ]] && [[ "${vite_port}" == "5173" ]] && [[ "${BASE_FLASK_PORT}" == "5000" ]]; then
      # Single instance on default ports - use exact same command as run-dev.sh
      npm run dev:web &
    else
      # Multiple instances or custom ports - use exec vite with port override and proxy env var
      # pnpm --filter runs from the package directory, so config path is relative to apps/web
      VITE_API_PROXY="http://localhost:${BASE_FLASK_PORT}" VITE_PORT="${vite_port}" pnpm --filter @silverkey/web exec vite --config vite.config.ts --port "${vite_port}" --host localhost >/dev/null 2>&1 &
    fi
    VITE_PIDS+=($!)
    popd >/dev/null
  done

  # Start background TypeScript watch (shared across all instances)
  log "Starting TypeScript watch..."
  pushd Client >/dev/null
  npm run -s typecheck:watch >/dev/null 2>&1 &
  TC_WATCH_PID=$!
  popd >/dev/null

  # Wait for all Vite instances to be ready
  for ((i=0; i<INSTANCE_COUNT; i++)); do
    vite_port=$((BASE_VITE_PORT + i))
    log "Waiting for Vite #$((i+1)) TCP on localhost:${vite_port}..."
    if wait_for_port localhost "${vite_port}" 30 1; then
      log "${GREEN}✅ Vite #$((i+1)) TCP is accepting on localhost:${vite_port}${NC}"
      log "${GREEN}   → Access at http://localhost:${vite_port}${NC}"
      log "${GREEN}   → Proxying to Flask on http://localhost:$((BASE_FLASK_PORT + i))${NC}"
    else
      warn "Vite #$((i+1)) did not start accepting TCP on port ${vite_port} within timeout. Exiting."
      exit 1
    fi
  done
else
  log "Production mode: skipping Vite dev server."
fi

# =========================
# Summary
# =========================
log ""
log "${GREEN}═══════════════════════════════════════════════════════════${NC}"
log "${GREEN}✅ All ${INSTANCE_COUNT} Vite instance(s) are running!${NC}"
log "${GREEN}═══════════════════════════════════════════════════════════${NC}"
log "${GREEN}Backend (shared): http://localhost:${BASE_FLASK_PORT}${NC}"
if [[ "${1:-}" != "--production" ]]; then
  for ((i=0; i<INSTANCE_COUNT; i++)); do
    vite_port=$((BASE_VITE_PORT + i))
    log "${GREEN}Frontend #$((i+1)): http://localhost:${vite_port}${NC}"
    log "  → Proxies to: http://localhost:${BASE_FLASK_PORT}"
  done
else
  log "${GREEN}Production mode: Frontend not started${NC}"
fi
log "${GREEN}═══════════════════════════════════════════════════════════${NC}"
log ""

# =========================
# Keep script in foreground
# =========================
# Wait for first Flask instance; CTRL+C will trigger cleanup()
wait "${FLASK_PIDS[0]}"
