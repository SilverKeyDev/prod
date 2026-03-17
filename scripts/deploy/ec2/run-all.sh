#!/usr/bin/env bash
# Orchestrate EC2 deploy by running each step script in sequence.
# Env: GITHUB_REPOSITORY, GITHUB_SHA (for script URLs); app env vars from appleboy.
# For private repos: set GITHUB_TOKEN and use API URL with auth.
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"
SHA="${GITHUB_SHA:?GITHUB_SHA not set}"
BASE="https://raw.githubusercontent.com/${REPO}/${SHA}/scripts/deploy/ec2"

fetch_and_run() {
  local name="$1"
  echo "--- Running $name ---"
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -sSL -H "Authorization: token $GITHUB_TOKEN" "${BASE}/${name}" | bash
  else
    curl -sSL "${BASE}/${name}" | bash
  fi
}

fetch_and_run "01-ensure-docker.sh"
fetch_and_run "02-cleanup-and-pull.sh"
fetch_and_run "03-start-redis.sh"
fetch_and_run "04-start-app.sh"
fetch_and_run "05-start-worker.sh"
fetch_and_run "06-sync-frontend.sh"
fetch_and_run "07-verify-health.sh"

echo "All EC2 deploy steps completed successfully."
