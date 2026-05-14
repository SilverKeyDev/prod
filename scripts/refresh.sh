#!/usr/bin/env bash
# Refresh after git pull: Client deps + Server pip installs (existing venv).
# Usage: ./scripts/refresh.sh [--ci] [--secrets]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RUN_SECRETS=false
BOOTSTRAP_CI=false
for arg in "$@"; do
  case "$arg" in
    --secrets) RUN_SECRETS=true ;;
    --ci) BOOTSTRAP_CI=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--ci] [--secrets]" >&2
      exit 1
      ;;
  esac
done

if [[ -d "$ROOT/scripts" ]]; then
  echo "==> scripts: chmod +x on *.sh under scripts/"
  find "$ROOT/scripts" -type f -name '*.sh' -exec chmod +x {} +
fi

echo "==> Client: pnpm install"
(cd Client && pnpm install)

bootstrap_args=(--refresh-deps)
if [[ "$BOOTSTRAP_CI" == true ]]; then
  bootstrap_args+=(--ci)
fi

echo "==> Server: refresh Python deps (bash Server/scripts/bootstrap-venv.sh ${bootstrap_args[*]})"
bash Server/scripts/bootstrap-venv.sh "${bootstrap_args[@]}"

if [[ "$RUN_SECRETS" == true ]]; then
  echo "==> Server: secrets"
  bash Server/scripts/secrets.sh "${AWS_REGION:-us-east-2}" "${AWS_PROFILE:-}"
fi

echo "refresh: done"
