#!/usr/bin/env bash
# Print all linter errors for frontend (Client) and backend (Server).
# Run from repo root: ./scripts/print-lint-errors.sh
# Does not exit on first failure so both frontend and backend output are shown.

set -uo pipefail

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

FRONTEND_FAIL=0
BACKEND_FAIL=0

# ---------- Frontend (Client) ----------
echo -e "${BLUE}========== Frontend (Client) ==========${NC}"

echo -e "\n${BLUE}--- ESLint ---${NC}"
if (cd Client && pnpm run lint 2>&1); then
  echo -e "${GREEN}ESLint: OK${NC}"
else
  FRONTEND_FAIL=1
  echo -e "${RED}ESLint: FAILED${NC}"
fi

echo -e "\n${BLUE}--- Prettier (format check) ---${NC}"
if (cd Client && pnpm run format:check 2>&1); then
  echo -e "${GREEN}Prettier: OK${NC}"
else
  FRONTEND_FAIL=1
  echo -e "${RED}Prettier: FAILED${NC}"
fi

echo -e "\n${BLUE}--- TypeScript (typecheck) ---${NC}"
if (cd Client && pnpm run typecheck 2>&1); then
  echo -e "${GREEN}TypeScript: OK${NC}"
else
  FRONTEND_FAIL=1
  echo -e "${RED}TypeScript: FAILED${NC}"
fi

# ---------- Backend (Server) ----------
echo -e "\n${BLUE}========== Backend (Server) ==========${NC}"

# Prefer venv if present
if [[ -d "$REPO_ROOT/Server/.venv" ]]; then
  # shellcheck disable=SC1091
  source "$REPO_ROOT/Server/.venv/bin/activate"
fi

echo -e "\n${BLUE}--- Ruff (lint) ---${NC}"
if (cd Server && ruff check . 2>&1); then
  echo -e "${GREEN}Ruff check: OK${NC}"
else
  BACKEND_FAIL=1
  echo -e "${RED}Ruff check: FAILED${NC}"
fi

echo -e "\n${BLUE}--- Ruff (format check) ---${NC}"
if (cd Server && ruff format --check . 2>&1); then
  echo -e "${GREEN}Ruff format: OK${NC}"
else
  BACKEND_FAIL=1
  echo -e "${RED}Ruff format: FAILED${NC}"
fi

echo -e "\n${BLUE}--- Pyright ---${NC}"
if (cd Server && pyright 2>&1); then
  echo -e "${GREEN}Pyright: OK${NC}"
else
  BACKEND_FAIL=1
  echo -e "${RED}Pyright: FAILED${NC}"
fi

# ---------- Summary ----------
echo -e "\n${BLUE}========== Summary ==========${NC}"
if [[ $FRONTEND_FAIL -eq 0 ]]; then
  echo -e "${GREEN}Frontend: all checks passed${NC}"
else
  echo -e "${RED}Frontend: some checks failed${NC}"
fi
if [[ $BACKEND_FAIL -eq 0 ]]; then
  echo -e "${GREEN}Backend: all checks passed${NC}"
else
  echo -e "${RED}Backend: some checks failed${NC}"
fi

if [[ $FRONTEND_FAIL -ne 0 ]] || [[ $BACKEND_FAIL -ne 0 ]]; then
  exit 1
fi
exit 0
