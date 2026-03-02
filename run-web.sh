#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=run-backend.sh
source "${ROOT_DIR}/run-backend.sh"
cd "$ROOT_DIR"

# =========================
# Web-specific PIDs
# =========================
VITE_PID=""
TC_WATCH_PID=""

# =========================
# Kill processes on web dev ports (5000, 5173, 6379)
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
# Cleanup on exit (backend + web)
# =========================
cleanup() {
  log "${RED}Cleaning up...${NC}"
  cleanup_backend
  if [[ -n "${VITE_PID}" ]];   then kill "${VITE_PID}"   2>/dev/null || true; fi
  if [[ -n "${TC_WATCH_PID}" ]]; then kill "${TC_WATCH_PID}" 2>/dev/null || true; fi
  pkill -P $$ 2>/dev/null || true
  log "${GREEN}All processes terminated.${NC}"
}

trap cleanup SIGINT SIGTERM EXIT

# =========================
# Prep
# =========================
log "${RED}Cleaning up existing processes on ports 5000, 5173, and 6379...${NC}"
kill_port_processes

# =========================
# Start backend (Redis, Flask, Celery)
# =========================
start_backend "$@"

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
# Start Vite (dev only)
# =========================
if [[ "${1:-}" != "--production" ]]; then
  log "Starting Vite client..."
  pushd Client >/dev/null
  npm run dev:web &
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
wait "${FLASK_PID}"
