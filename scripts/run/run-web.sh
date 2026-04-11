#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=run-backend.sh
source "${SCRIPT_DIR}/run-backend.sh"
cd "$ROOT_DIR"

# =========================
# Web-specific logging (stdout/stderr only)
# =========================
log_web() { echo -e "${BLUE}[$(date +%T)] [run-web]${NC} $1"; }
warn_web() { echo -e "${YELLOW}[$(date +%T)] [run-web] WARN:${NC} $1" >&2; }
err_web() {
  echo -e "${RED}[$(date +%T)] [run-web] ERROR:${NC} $1" >&2
  echo -e "${RED}  Context: ROOT_DIR=$ROOT_DIR NO_BACKEND=$NO_BACKEND SKIP_TYPECHECK=$SKIP_TYPECHECK${NC}" >&2
}

# =========================
# Config
# =========================
VITE_PORT="${VITE_PORT:-5173}"
TYPECHECK_TIMEOUT="${TYPECHECK_TIMEOUT:-120}"

# =========================
# Flags
# =========================
SKIP_TYPECHECK=false
NO_BACKEND=false
NO_BROWSER=false
for arg in "$@"; do
  case "$arg" in
    --skip-typecheck) SKIP_TYPECHECK=true ;;
    --no-backend) NO_BACKEND=true ;;
    --no-browser) NO_BROWSER=true ;;
  esac
done

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
    log_web "Checking for processes on port $port..."
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      log_web "${RED}Killing processes on port $port: ${pids}${NC}"
      echo "${pids}" | xargs kill -9 2>/dev/null || true
      sleep 1
      local remaining
      remaining=$(lsof -ti:"$port" 2>/dev/null || true)
      if [[ -n "${remaining}" ]]; then
        warn_web "Some processes on port $port may still be running"
      else
        log_web "${GREEN}✅ Port $port is now free${NC}"
      fi
    else
      log_web "${GREEN}✅ Port $port is already free${NC}"
    fi
  done
}

# Kill only web ports (5173) when --no-backend
kill_port_processes_web_only() {
  local port=5173
  log_web "Checking for processes on port $port..."
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [[ -n "${pids}" ]]; then
    log_web "${RED}Killing processes on port $port: ${pids}${NC}"
    echo "${pids}" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    log_web "${GREEN}✅ Port $port is already free${NC}"
  fi
}

# =========================
# Cleanup on exit (backend + web)
# =========================
cleanup() {
  log_web "${RED}Cleaning up...${NC}"
  if [[ "$NO_BACKEND" != "true" ]]; then
    cleanup_backend
  fi
  if [[ -n "${VITE_PID}" ]];   then kill "${VITE_PID}"   2>/dev/null || true; fi
  if [[ -n "${TC_WATCH_PID}" ]]; then kill "${TC_WATCH_PID}" 2>/dev/null || true; fi
  pkill -P $$ 2>/dev/null || true
  log_web "${GREEN}All processes terminated.${NC}"
}

trap 'EXIT_CODE=$?; [[ $EXIT_CODE -ne 0 ]] && err_web "Script exiting with code $EXIT_CODE"; cleanup; exit $EXIT_CODE' SIGINT SIGTERM EXIT

# =========================
# Prep
# =========================
log_web "Starting run-web.sh | ROOT_DIR=$ROOT_DIR | NO_BACKEND=$NO_BACKEND | SKIP_TYPECHECK=$SKIP_TYPECHECK | args=$*"
if [[ "$NO_BACKEND" == "true" ]]; then
  log_web "[Phase 1/4] Cleaning up existing processes on port 5173 only (--no-backend)..."
  kill_port_processes_web_only
else
  log_web "[Phase 1/4] Cleaning up existing processes on ports 5000, 5173, and 6379..."
  kill_port_processes
fi

# =========================
# Start backend (Redis, Flask, Celery) unless --no-backend
# =========================
if [[ "$NO_BACKEND" != "true" ]]; then
  start_backend "$@"
fi

# =========================
# Preflight TypeScript typecheck (fail fast)
# =========================
if [[ "$SKIP_TYPECHECK" == "true" ]]; then
  log_web "[Phase 2/4] Skipping TypeScript preflight (--skip-typecheck)"
else
  log_web "[Phase 2/4] Running TypeScript preflight check (timeout: ${TYPECHECK_TIMEOUT}s)..."
  pushd Client >/dev/null
  TYPECHECK_LOG=$(mktemp)
  export CI=true
  if run_with_timeout "$TYPECHECK_TIMEOUT" bash -c 'pnpm -s typecheck 2>&1 | tee "$1"; exit "${PIPESTATUS[0]}"' _ "$TYPECHECK_LOG"; then
    log_web "${GREEN}✅ TypeScript preflight passed${NC}"
    rm -f "$TYPECHECK_LOG"
  else
    EXIT=$?
    err_web "TypeScript preflight failed (exit=$EXIT). Run: cd Client && pnpm typecheck"
    warn_web "Typecheck output:"
    cat "$TYPECHECK_LOG" 2>/dev/null || true
    rm -f "$TYPECHECK_LOG"
    popd >/dev/null
    exit 1
  fi
  popd >/dev/null
fi

# =========================
# Start Vite (dev only)
# =========================
if [[ "${1:-}" != "--production" ]]; then
  log_web "[Phase 3/4] Starting Vite client..."
  pushd Client >/dev/null
  pnpm dev:web &
  VITE_PID=$!

  # Start background TypeScript watch so type errors are surfaced continuously
  pnpm -s typecheck:watch >/dev/null 2>&1 &
  TC_WATCH_PID=$!
  popd >/dev/null

  log_web "[Phase 4/4] Waiting for Vite TCP on localhost:${VITE_PORT} (up to 60s for first-run optimizeDeps)..."
  if wait_for_port localhost "${VITE_PORT}" 60 1; then
    log_web "${GREEN}✅ Vite TCP is accepting on localhost:${VITE_PORT}${NC}"
  else
    err_web "Vite did not start on localhost:${VITE_PORT} within 60s. Possible causes: port in use, pnpm/node failure, Vite config error."
    warn_web "Diagnostics: lsof -i :${VITE_PORT} | head -5; cd Client && pnpm typecheck; try --skip-typecheck if typecheck passes"
    exit 1
  fi
else
  log_web "Production mode: skipping Vite dev server."
fi

# =========================
# Keep script in foreground
# =========================
if [[ "$NO_BACKEND" == "true" ]]; then
  wait "${VITE_PID}"
else
  wait "${FLASK_PID}"
fi
