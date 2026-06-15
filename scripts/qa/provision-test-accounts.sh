#!/usr/bin/env bash
# Provision SIL-145 QA accounts (Cognito + DB). Requires Server/.env with AWS Cognito credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/Server"

if [[ ! -d .venv ]]; then
  echo "Server/.venv missing — run make setup from repo root first" >&2
  exit 1
fi

# shellcheck disable=SC1091
source .venv/bin/activate
python scripts/qa/provision_test_accounts.py "$@"
