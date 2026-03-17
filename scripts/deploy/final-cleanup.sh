#!/usr/bin/env bash
# Final cleanup of GitHub Actions runner (Docker, apt, caches).
# Run with if: always() so it runs even on failure.
set -euo pipefail

echo "Final GitHub Actions runner cleanup..."
docker buildx prune -af >/dev/null 2>&1 || true
docker system prune -af --volumes >/dev/null 2>&1 || true
docker builder prune -af >/dev/null 2>&1 || true
docker image prune -af >/dev/null 2>&1 || true
docker volume prune -f >/dev/null 2>&1 || true

sudo apt-get clean >/dev/null 2>&1 || true
sudo rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* >/dev/null 2>&1 || true
sudo journalctl --vacuum-time=1d >/dev/null 2>&1 || true
sudo rm -rf ~/.cache /root/.cache /tmp/* /var/tmp/* >/dev/null 2>&1 || true

echo "Final disk usage:"
df -h
docker system df || true
