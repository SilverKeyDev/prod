#!/usr/bin/env bash
# Free disk space on GitHub Actions runner.
# --aggressive: also prune buildx, swapoff, hostedtoolcache (ci_web)
# --minimal: only remove dotnet, ghc, android (sunday_newsletter)
set -euo pipefail

MODE="${1:-minimal}"

echo "Disk space before cleanup:"
df -h

# Common removals
sudo rm -rf /usr/share/dotnet /opt/ghc /usr/local/lib/android || true

if [ "$MODE" = "--aggressive" ]; then
  echo "Freeing disk on runner (aggressive)..."
  sudo rm -rf /opt/hostedtoolcache || true
  docker buildx prune -af >/dev/null 2>&1 || true
  sudo swapoff -a || true
  sudo rm -f /swapfile || true
fi

echo "Disk space after cleanup:"
df -h
