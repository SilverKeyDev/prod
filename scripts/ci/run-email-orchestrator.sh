#!/usr/bin/env bash
# Run email listings orchestrator and append output to GITHUB_STEP_SUMMARY.
# Requires: DATABASE_URL, PYTHONPATH=Server, AWS_REGION in env.
# Optional: TEST_EMAIL for test workflow.
set -euo pipefail

echo "Starting orchestrator..."
echo "Node.js version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Checking email render script availability..."
test -f Client/packages/email-templates/render-email.ts && echo "Render script found" || echo "Render script missing"

python Server/app/services/email/run_email_listings.py | tee orchestrator_out.txt

{
  echo "### Email Listings Orchestrator"
  echo ""
  echo '```'
  cat orchestrator_out.txt
  echo '```'
} >> "$GITHUB_STEP_SUMMARY"
