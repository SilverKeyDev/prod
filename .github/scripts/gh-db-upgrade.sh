#!/usr/bin/env bash
# gh-db-upgrade.sh — run Alembic migrations against prod DB from GitHub Actions.
# Requires: aws CLI, docker, python3. Env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
#           DB_URL_SECRET_ID (optional; default db_url). Run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

REGION="${AWS_REGION:?AWS_REGION must be set}"
DB_SECRET_NAME="${DB_URL_SECRET_ID:-db_url}"

extract_database_url() {
  python3 - <<'PY'
import json
import os
import subprocess
import sys

region = os.environ["AWS_REGION"]
name = os.environ["DB_SECRET_NAME"]
try:
    raw = subprocess.check_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            name,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ],
        text=True,
    ).strip()
except subprocess.CalledProcessError:
    print("ERROR: Failed to read database secret from Secrets Manager.", file=sys.stderr)
    sys.exit(1)

if not raw:
    print("ERROR: SecretString empty for secret.", file=sys.stderr)
    sys.exit(1)

try:
    val = json.loads(raw)
except json.JSONDecodeError:
    print(raw)
    sys.exit(0)

if isinstance(val, str):
    print(val)
elif isinstance(val, dict):
    for k in (
        "DATABASE_URL",
        "database_url",
        "db_url",
        "url",
        "connection_string",
        "connectionString",
        "uri",
        "URI",
    ):
        v = val.get(k)
        if isinstance(v, str) and v.strip():
            print(v.strip())
            sys.exit(0)
    print("ERROR: JSON secret has no recognizable database URL field.", file=sys.stderr)
    sys.exit(1)
else:
    print("ERROR: Unsupported secret JSON shape.", file=sys.stderr)
    sys.exit(1)
PY
}

export DB_SECRET_NAME
DATABASE_URL="$(DB_SECRET_NAME="$DB_SECRET_NAME" AWS_REGION="$REGION" extract_database_url)"
export DATABASE_URL

echo "🔄 Building backend image for migrations (Dockerfile.web --target backend)..."
docker build \
  -f Dockerfile.web \
  --target backend \
  --platform linux/amd64 \
  -t silverkey-backend-migrate:ci \
  .

echo "🔄 Running flask db upgrade..."
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SECRET_KEY="migration-cli-placeholder-not-for-serving-traffic" \
  -e FLASK_APP=run:app \
  -w /app/Server \
  silverkey-backend-migrate:ci \
  flask db upgrade

echo "✅ Database migrations applied."
