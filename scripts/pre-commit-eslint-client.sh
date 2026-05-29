#!/usr/bin/env bash
# Run ESLint --fix on staged Client files. Reports issues; does not block commits
# (the githooks/pre-commit wrapper always exits 0).
set -uo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "${_HERE}/../Client" || exit 0
rel=()
for f in "$@"; do
  rel+=("${f#Client/}")
done
if [ "${#rel[@]}" -eq 0 ]; then
  exit 0
fi
pnpm exec eslint \
  --config packages/config/eslint/eslint.config.cjs \
  --fix \
  --no-warn-ignored \
  "${rel[@]}" || true
exit 0
