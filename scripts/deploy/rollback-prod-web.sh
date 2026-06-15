#!/usr/bin/env bash
# Dispatch the prod web deploy workflow with an existing immutable ECR image tag.
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  scripts/deploy/rollback-prod-web.sh <prior-12-char-sha-tag> [--ref <branch-or-sha>]

Example:
  scripts/deploy/rollback-prod-web.sh a1b2c3d4e5f6

Requires:
  gh auth login
  GitHub Actions permission to run ci_web.yml
USAGE
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

IMAGE_TAG="${1:-}"
if [ -z "$IMAGE_TAG" ]; then
  usage
  exit 2
fi
shift

REF="main"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --ref)
      REF="${2:-}"
      if [ -z "$REF" ]; then
        echo "ERROR: --ref requires a value." >&2
        exit 2
      fi
      shift 2
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is required." >&2
  exit 127
fi

gh workflow run ci_web.yml --ref "$REF" -f image_tag="$IMAGE_TAG"
