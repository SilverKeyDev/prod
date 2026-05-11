#!/usr/bin/env bash
# Run ESLint using the Client workspace (pnpm + full plugin graph). Pre-commit
# passes repo-root paths like Client/apps/web/foo.tsx; strip the Client/ prefix
# so resolution matches `pnpm run lint` (cwd = Client).
set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "${_HERE}/../Client" || exit 1
rel=()
for f in "$@"; do
  rel+=("${f#Client/}")
done
if [ "${#rel[@]}" -eq 0 ]; then
  exit 0
fi
exec pnpm exec eslint --config packages/config/eslint/eslint.config.cjs --fix --max-warnings=0 --no-warn-ignored "${rel[@]}"
