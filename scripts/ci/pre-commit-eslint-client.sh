#!/usr/bin/env bash
# Run ESLint --fix on staged Client files. Reports issues; does not block commits
# (the githooks/pre-commit wrapper always exits 0).
set -uo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "${_HERE}/../../Client" || exit 0
rel=()
for f in "$@"; do
  candidate="${f#Client/}"
  if [ -f "$candidate" ]; then
    rel+=("$candidate")
  fi
done
if [ "${#rel[@]}" -eq 0 ]; then
  exit 0
fi
# xargs batches paths to stay under ARG_MAX when pre-commit passes the full tree.
printf '%s\0' "${rel[@]}" | xargs -0 pnpm exec eslint \
  --config packages/config/eslint/eslint.config.cjs \
  --fix \
  --no-warn-ignored \
  || true
exit 0
