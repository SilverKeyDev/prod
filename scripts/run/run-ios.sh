#!/usr/bin/env bash
# Run iOS app: kill stale Metro/xcodebuild, ensure backend is up, start Metro + iOS.
# Invoked from Client/ via: pnpm ios, or from project root via ./scripts/run/run-ios.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=dev_ports.sh
source "${SCRIPT_DIR}/dev_ports.sh"
CLIENT_DIR="${PROJECT_ROOT}/Client"
FLASK_PORT="${FLASK_PORT:-5000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%T)] [run-ios]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +%T)] [run-ios] WARN:${NC} $1" >&2; }
err() {
  echo -e "${RED}[$(date +%T)] [run-ios] ERROR:${NC} $1" >&2
  echo -e "${RED}  Context: PROJECT_ROOT=$PROJECT_ROOT CLIENT_DIR=$CLIENT_DIR FLASK_PORT=$FLASK_PORT${NC}" >&2
}

# =========================
# 1. Kill stale Metro, xcodebuild, and node processes on 8081
# =========================
log "Starting run-ios.sh | PROJECT_ROOT=$PROJECT_ROOT | CLIENT_DIR=$CLIENT_DIR | FLASK_PORT=$FLASK_PORT"
log "Cleaning up existing Metro and xcodebuild processes..."
pkill -9 xcodebuild 2>/dev/null || true
for port in 8081; do
  if dev_port_busy "$port"; then
    log "Killing processes on port $port"
    dev_kill_tcp_port "$port" || true
    sleep 2
  fi
done
log "${GREEN}✅ Cleanup complete${NC}"

# =========================
# 2. Check if backend is up; if not, run run-backend.sh in a new terminal
# =========================
backend_up() {
  curl -4 -fsS "http://127.0.0.1:${FLASK_PORT}/healthz" >/dev/null 2>&1 || \
  curl -4 -fsS "http://127.0.0.1:${FLASK_PORT}/" >/dev/null 2>&1
}

if backend_up; then
  log "${GREEN}✅ Backend is already running on port ${FLASK_PORT}${NC}"
else
  warn "Backend is not running on port ${FLASK_PORT}. Opening new Terminal window to start backend..."
  if [[ "$(uname)" == "Darwin" ]]; then
    if ! osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && ./scripts/run/run-backend.sh\"" 2>/dev/null; then
      err "osascript failed to open Terminal. Run './scripts/run/run-backend.sh' manually in another terminal, then re-run this script."
      exit 1
    fi
  else
    warn "Non-macOS: run './scripts/run/run-backend.sh' in a separate terminal from project root, then press Enter here."
    read -r
  fi
  log "Waiting for backend to be ready (up to 45s)..."
  for i in $(seq 1 45); do
    if backend_up; then
      log "${GREEN}✅ Backend is ready${NC}"
      break
    fi
    [[ $i -eq 45 ]] && { err "Backend did not become ready within 45s. Check the backend terminal for errors. Continuing anyway."; break; }
    sleep 1
  done
fi

# =========================
# 3. Start Metro (with cache clear) and iOS
# =========================
if [[ ! -d "$CLIENT_DIR" ]]; then
  err "CLIENT_DIR does not exist: $CLIENT_DIR"
  exit 1
fi
cd "$CLIENT_DIR" || { err "Failed to cd to CLIENT_DIR=$CLIENT_DIR"; exit 1; }

if ! command -v pnpm >/dev/null 2>&1; then
  err "pnpm not found in PATH. Run: cd Client && pnpm install"
  exit 1
fi

# Optional: run Tailwind content-scan verification before Metro (STYLING_VERIFY=1)
if [[ "${STYLING_VERIFY:-0}" == "1" ]]; then
  log "Running styling:content-scan-verify..."
  if pnpm styling:content-scan-verify 2>&1; then
    log "${GREEN}✅ Styling content-scan passed${NC}"
  else
    warn "Styling content-scan had issues; continuing anyway"
  fi
fi

# Clear NativeWind css-interop cache so styles regenerate (fixes empty cache after path resolution)
CACHE_DIR="${CLIENT_DIR}/node_modules/react-native-css-interop/.cache"
if [[ -d "$CACHE_DIR" ]]; then
  rm -f "$CACHE_DIR"/*.js "$CACHE_DIR"/*.map 2>/dev/null || true
  log "Cleared NativeWind css-interop cache"
fi

# NativeWind debugging: set DEBUG=nativewind for Metro when DEBUG_NATIVEWIND=1
# Usage: DEBUG_NATIVEWIND=1 ./scripts/run/run-ios.sh  or  DEBUG_NATIVEWIND=1 ./scripts/run/run-all.sh
if [[ "${DEBUG_NATIVEWIND:-0}" == "1" ]] || [[ "${DEBUG:-}" == *nativewind* ]]; then
  export DEBUG="${DEBUG:-nativewind}"
  log "NativeWind debug enabled (DEBUG=$DEBUG)"
fi

log "Starting Metro (with cache clear) and iOS..."
exec pnpm exec concurrently -n metro,ios \
  "pnpm dev:mobile:clear" \
  "bash -c 'for i in \$(seq 1 60); do command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 8081 && break; sleep 1; done; pkill -9 xcodebuild 2>/dev/null || true; pnpm --filter @silverkey/mobile exec expo run:ios'"
