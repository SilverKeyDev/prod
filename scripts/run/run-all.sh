#!/usr/bin/env bash
# Run backend, web, and iOS in three separate Terminal windows.
# macOS only (uses osascript + Terminal.app).
#
# On start: kills existing processes on dev ports, closes all Terminal.app windows,
# then opens fresh terminals.
#
# Debugging:
#   DEBUG_NATIVEWIND=1  - Enable NativeWind debug logs in Metro (e.g. DEBUG_NATIVEWIND=1 ./scripts/run/run-all.sh)
#   STYLING_VERIFY=1    - Run styling:content-scan-verify before iOS (in run-ios.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLASK_PORT="${FLASK_PORT:-5000}"
VITE_PORT="${VITE_PORT:-5173}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%T)] [run-all]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +%T)] [run-all] WARN:${NC} $1" >&2; }
err() {
  echo -e "${RED}[$(date +%T)] [run-all] ERROR:${NC} $1" >&2
  echo -e "${RED}  Context: PROJECT_ROOT=$PROJECT_ROOT FLASK_PORT=$FLASK_PORT VITE_PORT=$VITE_PORT${NC}" >&2
}

# Kill processes on dev ports (backend, web) from previous runs
# iOS (8081, xcodebuild) commented out for now
kill_dev_port_processes() {
  log "Killing existing processes on dev ports (5000, 5173, 6379)..."
  for port in 5000 5173 6379; do
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      log "Killing processes on port $port: ${pids}"
      echo "${pids}" | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  done
  # pkill -9 xcodebuild 2>/dev/null || true  # iOS - commented out for now
  log "${GREEN}✅ Dev ports cleared${NC}"
}

# Close all Terminal.app windows (does not affect Cursor/VS Code terminal).
# Set RUN_ALL_SKIP_CLOSE_TERMINALS=1 to skip if you run from Terminal.app (closing would kill the script).
close_all_terminal_windows() {
  [[ "${RUN_ALL_SKIP_CLOSE_TERMINALS:-0}" == "1" ]] && { log "Skipping close (RUN_ALL_SKIP_CLOSE_TERMINALS=1)"; return 0; }
  log "Closing all Terminal.app windows..."
  osascript -e 'tell application "Terminal" to close every window' 2>/dev/null || true
  sleep 1
  log "${GREEN}✅ Terminal windows closed${NC}"
}

log "Starting run-all.sh | PROJECT_ROOT=$PROJECT_ROOT | FLASK_PORT=$FLASK_PORT | VITE_PORT=$VITE_PORT"

if [[ "$(uname)" != "Darwin" ]]; then
  err "run-all.sh requires macOS (uses osascript + Terminal.app)"
  warn "On other platforms, run each script manually in separate terminals:"
  echo "  Terminal 1: cd $PROJECT_ROOT && ./scripts/run/run-backend.sh"
  echo "  Terminal 2: cd $PROJECT_ROOT && ./scripts/run/run-web.sh --no-backend"
  echo "  Terminal 3: cd $PROJECT_ROOT && ./scripts/run/run-ios.sh"
  echo "  Then open http://localhost:${VITE_PORT} in your browser"
  exit 1
fi

# Step 1: Kill existing dev processes and close all Terminal.app windows
kill_dev_port_processes
close_all_terminal_windows

if [[ ! -x "${PROJECT_ROOT}/scripts/run/run-backend.sh" ]]; then
  err "run-backend.sh not executable or missing at ${PROJECT_ROOT}/scripts/run/run-backend.sh"
  exit 1
fi

log "Opening Terminal windows and starting backend, web..."

# Terminal 1: Backend
log "Terminal 1: Opening new Terminal and starting backend (Redis, Flask, Celery)..."

if ! osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && ./scripts/run/run-backend.sh\"" 2>&1; then
  err "osascript failed to open Terminal for backend. Run manually: cd $PROJECT_ROOT && ./scripts/run/run-backend.sh"
  exit 1
fi

# Wait for backend to be ready
log "Waiting for backend to be ready (up to 45s)..."
for i in $(seq 1 45); do
  if curl -4 -fsS "http://127.0.0.1:${FLASK_PORT}/healthz" >/dev/null 2>&1 || \
     curl -4 -fsS "http://127.0.0.1:${FLASK_PORT}/" >/dev/null 2>&1; then
    log "${GREEN}✅ Backend is ready${NC}"
    break
  fi
  [[ $i -eq 45 ]] && {
    err "Backend did not respond on port ${FLASK_PORT} within 45s. Check the backend Terminal for errors (Flask, Redis, DB)."
    break
  }
  sleep 1
done

# Terminal 2: Web (frontend only)
log "Terminal 2: Opening new Terminal and starting web (Vite)..."

if ! osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && ./scripts/run/run-web.sh --no-backend --no-browser\"" 2>&1; then
  err "osascript failed to open Terminal for web. Run manually: cd $PROJECT_ROOT && ./scripts/run/run-web.sh --no-backend --no-browser"
  exit 1
fi

# Wait for Vite to be ready
log "Waiting for Vite to be ready on port ${VITE_PORT} (up to 60s)..."
for i in $(seq 1 60); do
  if nc -z localhost "${VITE_PORT}" 2>/dev/null; then
    log "${GREEN}✅ Vite is ready at http://localhost:${VITE_PORT}${NC}"
    break
  fi
  [[ $i -eq 60 ]] && {
    err "Vite did not start on port ${VITE_PORT} within 60s. Check the web Terminal for errors (pnpm, Vite, typecheck)."
    break
  }
  sleep 1
done

if [[ -x "${SCRIPT_DIR}/open-localhost-chrome.sh" ]]; then
  log "Opening Chrome tabs for app root and /admin (if not already open)..."
  VITE_PORT="${VITE_PORT}" "${SCRIPT_DIR}/open-localhost-chrome.sh" || warn "open-localhost-chrome.sh exited non-zero (Chrome may be unavailable)"
else
  warn "open-localhost-chrome.sh missing or not executable at ${SCRIPT_DIR}/open-localhost-chrome.sh"
fi

# Terminal 3: iOS (Metro + simulator) - commented out for now
# DEBUG_NATIVEWIND=1 for NativeWind debug logs; STYLING_VERIFY=1 for content-scan preflight
# IOS_ENV=""
# [[ -n "${DEBUG_NATIVEWIND:-}" ]] && IOS_ENV="${IOS_ENV}DEBUG_NATIVEWIND=1 "
# [[ -n "${STYLING_VERIFY:-}" ]] && IOS_ENV="${IOS_ENV}STYLING_VERIFY=1 "
# IOS_SCRIPT="cd '$PROJECT_ROOT' && ${IOS_ENV}./scripts/run/run-ios.sh"
# log "Terminal 3: Opening new Terminal and starting iOS (Metro + simulator)..."
# if ! osascript -e "tell application \"Terminal\" to do script \"$IOS_SCRIPT\"" 2>&1; then
#   err "osascript failed to open Terminal for iOS. Run manually: cd $PROJECT_ROOT && ./scripts/run/run-ios.sh"
#   exit 1
# fi

log "${GREEN}✅ All terminals launched. Backend, Web running at http://localhost:${VITE_PORT}${NC}"
