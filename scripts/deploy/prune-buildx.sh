#!/usr/bin/env bash
# Prune Docker Buildx cache after build.
set -euo pipefail

docker buildx prune -af >/dev/null 2>&1 || true
docker system df || true
