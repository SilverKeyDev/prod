#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=run-backend.sh
source "${ROOT_DIR}/run-backend.sh"
cd "$ROOT_DIR"

# =========================
# Config (run-mobile specific)
# =========================
LOG_DIR="${RUN_MOBILE_LOG_DIR:-${ROOT_DIR}/.run-mobile-logs}"
[[ "$LOG_DIR" != /* ]] && LOG_DIR="${ROOT_DIR}/${LOG_DIR}"

# =========================
# Flags (parsed below)
# =========================
DO_INSTALL=false
PRODUCTION=false
for arg in "$@"; do
  case "$arg" in
    --install)     DO_INSTALL=true ;;
    --production)  PRODUCTION=true ;;
    -h|--help)
      echo "Usage: $0 [--install] [--production]"
      echo "  --install     Run pnpm install (Client) and pip install -r requirements.txt (Server) before starting."
      echo "  --production  Start Flask with gunicorn; skip Vite and Metro."
      echo ""
      echo "Process logs: Redis, Celery, Flask → ${LOG_DIR}/ (default: .run-mobile-logs/)"
      exit 0
      ;;
  esac
done

# =========================
# Mobile-specific PIDs
# =========================
VITE_PID=""
TC_WATCH_PID=""
METRO_PID=""

# =========================
# Kill processes on web + mobile dev ports (5000, 5173, 6379, 8081)
# =========================
kill_port_processes() {
  local ports=(5000 5173 6379 8081)
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
# Cleanup on exit (backend + web + metro)
# =========================
cleanup() {
  log "${RED}Cleaning up...${NC}"
  cleanup_backend
  if [[ -n "${VITE_PID}" ]];   then kill "${VITE_PID}"   2>/dev/null || true; fi
  if [[ -n "${TC_WATCH_PID}" ]]; then kill "${TC_WATCH_PID}" 2>/dev/null || true; fi
  if [[ -n "${METRO_PID}" ]];  then kill "${METRO_PID}"  2>/dev/null || true; fi
  pkill -P $$ 2>/dev/null || true
  log "${GREEN}All processes terminated.${NC}"
}

trap cleanup SIGINT SIGTERM EXIT

# =========================
# Optional: install dependencies
# =========================
if [[ "$DO_INSTALL" == "true" ]]; then
  log "${YELLOW}Running --install: updating dependencies...${NC}"
  log "Installing Client dependencies (pnpm install)..."
  pushd Client >/dev/null
  pnpm install
  popd >/dev/null
  log "${GREEN}✅ Client dependencies installed${NC}"
  if [[ -f Server/requirements.txt ]]; then
    log "Installing Server dependencies (pip install -r requirements.txt)..."
    pushd Server >/dev/null
    if [[ -d ".venv" ]]; then
      source .venv/bin/activate
      pip install -r requirements.txt
    else
      python3 -m pip install -r requirements.txt
    fi
    popd >/dev/null
    log "${GREEN}✅ Server dependencies installed${NC}"
  else
    warn "Server/requirements.txt not found; skipping pip install."
  fi
fi

# =========================
# Prep
# =========================
mkdir -p "${LOG_DIR}"
export LOG_DIR
log "Process logs: ${LOG_DIR}/ (redis.log, celery.log, flask.log, typecheck-watch.log)"
log "${RED}Cleaning up existing processes on ports 5000, 5173, 6379, and 8081...${NC}"
kill_port_processes

# =========================
# Start backend (Redis, Flask, Celery) with log files in LOG_DIR
# =========================
if [[ "$PRODUCTION" == "true" ]]; then
  start_backend --production
else
  start_backend
fi

# =========================
# Preflight TypeScript typecheck (fail fast)
# =========================
log "Running TypeScript preflight check..."
pushd Client >/dev/null
if pnpm -s typecheck >/dev/null 2>&1; then
  log "${GREEN}✅ TypeScript preflight passed${NC}"
else
  warn "❌ TypeScript preflight failed. Fix type errors and re-run."
  popd >/dev/null
  exit 1
fi
popd >/dev/null

# =========================
# Start Vite + Metro (dev only)
# =========================
if [[ "$PRODUCTION" != "true" ]]; then
  log "Starting Vite client..."
  pushd Client >/dev/null
  pnpm dev:web &
  VITE_PID=$!

  pnpm -s typecheck:watch >>"${LOG_DIR}/typecheck-watch.log" 2>&1 &
  TC_WATCH_PID=$!

  log "Starting Metro bundler (mobile) from Client..."
  pnpm dev:mobile &
  METRO_PID=$!
  popd >/dev/null

  log "Waiting for Vite TCP on localhost:5173..."
  if wait_for_port localhost 5173 30 1; then
    log "${GREEN}✅ Vite TCP is accepting on localhost:5173${NC}"
  else
    warn "Vite did not start accepting TCP on port 5173 within timeout. Exiting."
    exit 1
  fi

  log "Waiting for Metro TCP on localhost:8081..."
  if wait_for_port localhost 8081 30 1; then
    log "${GREEN}✅ Metro is ready on localhost:8081 (run 'pnpm ios' or 'pnpm android' in Client to launch the app)${NC}"
  else
    warn "Metro did not start accepting TCP on port 8081 within timeout. Mobile app may still start; check Client for Metro output."
  fi
else
  log "Production mode: skipping Vite and Metro dev servers."
fi

# =========================
# Keep script in foreground
# =========================
wait "${FLASK_PID}"
