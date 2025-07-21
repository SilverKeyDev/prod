#!/bin/bash

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Initialize PIDs to avoid unbound errors
FLASK_PID=""
VITE_PID=""
CELERY_PID=""

# Function to log messages with timestamp
log() {
    echo -e "${BLUE}[$(date +%T)]${NC} $1"
}

# Function to clean up on exit
cleanup() {
    log "${RED}Cleaning up..."
    if [[ -n "$FLASK_PID" ]]; then
        kill "$FLASK_PID" 2>/dev/null || true
    fi
    if [[ -n "$VITE_PID" ]]; then
        kill "$VITE_PID" 2>/dev/null || true
    fi
    if [[ -n "$CELERY_PID" ]]; then
        kill "$CELERY_PID" 2>/dev/null || true
    fi
    log "${GREEN}All processes terminated.${NC}"
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Load environment variables
if [ -f Server/.env ]; then
    log "Loading environment variables from Server/.env"
    source Server/.env
fi

# Start Vite client in background
log "Starting Vite client..."
cd Client || exit 1
npm run dev &
VITE_PID=$!
cd ..

# Wait for Vite to be ready
log "Waiting for Vite to start on http://localhost:5173..."
until curl -s http://localhost:5173 > /dev/null; do
  sleep 0.5
done
log "${GREEN}✅ Vite is ready at http://localhost:5173${NC}"

# Start Celery worker in background
log "Starting Celery worker..."
cd Server || exit 1
celery -A app.celery.celery_worker:celery worker --loglevel=info &
CELERY_PID=$!
cd ..
log "${GREEN}✅ Celery worker started${NC}"

# Start Flask server
if [ "${1:-}" = "--production" ]; then
    log "Starting Flask server in ${RED}production${NC} mode..."
    cd Server || exit 1
    gunicorn -w 4 -b 0.0.0.0:5001 run:app --access-logfile - --error-logfile -
    cd ..
else
    log "Starting Flask server in ${GREEN}development${NC} mode..."
    cd Server || exit 1
    python run.py --host 0.0.0.0 --port 5000 &
    FLASK_PID=$!
    cd ..

    # Wait for Flask to finish (until Ctrl+C)
    wait "$FLASK_PID"
fi