#!/usr/bin/env bash
# Fail when Dockerfile.web backend stage invokes scripts/install-torch-cpu.sh
# before that script (or a broader Server/scripts or Server/ tree) is COPY'd.
#
# Catches the prod-deploy class of bug where RUN bash scripts/install-torch-cpu.sh
# runs after COPY Server/requirements but before COPY Server/.
#
# Usage:
#   bash scripts/ci/check-dockerfile-web-backend-deps.sh
#   bash scripts/ci/check-dockerfile-web-backend-deps.sh /path/to/Dockerfile.web
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKERFILE="${1:-$ROOT/Dockerfile.web}"
SCRIPT_REL="Server/scripts/install-torch-cpu.sh"

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "check-dockerfile-web-backend-deps: Dockerfile not found: $DOCKERFILE" >&2
  exit 1
fi

if [[ ! -f "$ROOT/$SCRIPT_REL" ]]; then
  echo "check-dockerfile-web-backend-deps: missing repo script: $SCRIPT_REL" >&2
  exit 1
fi

python3 - "$DOCKERFILE" "$SCRIPT_REL" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

dockerfile = Path(sys.argv[1])
script_rel = sys.argv[2]
run_needle = "bash scripts/install-torch-cpu.sh"

text = dockerfile.read_text(encoding="utf-8")
buf: list[str] = []
logical: list[str] = []
for raw in text.splitlines():
    line = raw.rstrip()
    if not line.strip() or line.lstrip().startswith("#"):
        continue
    if line.endswith("\\"):
        buf.append(line[:-1].rstrip())
        continue
    buf.append(line)
    logical.append(" ".join(part.strip() for part in buf if part.strip()))
    buf = []
if buf:
    logical.append(" ".join(part.strip() for part in buf if part.strip()))


def copy_provides_torch_script(instruction: str) -> bool:
    """True when a COPY instruction makes install-torch-cpu.sh available in the image."""
    # Drop the COPY keyword for source matching.
    body = re.sub(r"(?i)^COPY\s+", "", instruction).strip()
    sources = body.split()
    if not sources:
        return False
    # Last token is destination; sources are everything before it (ignore --flags).
    srcs: list[str] = []
    for tok in sources[:-1]:
        if tok.startswith("--"):
            continue
        srcs.append(tok)
    for src in srcs:
        if src == "Server/scripts/install-torch-cpu.sh":
            return True
        if src.rstrip("/") in {"Server/scripts", "Server"}:
            return True
        if src in {"Server/scripts/", "Server/"}:
            return True
    return False


in_backend = False
seen_torch_copy = False
run_line = ""

for line in logical:
    upper = line.upper()
    if upper.startswith("FROM "):
        in_backend = bool(re.search(r"\bAS\s+BACKEND\b", upper))
        seen_torch_copy = False
        continue
    if not in_backend:
        continue
    if upper.startswith("COPY "):
        if copy_provides_torch_script(line):
            seen_torch_copy = True
        continue
    if run_needle in line:
        run_line = line
        if not seen_torch_copy:
            print(
                "check-dockerfile-web-backend-deps: backend stage runs "
                f"'{run_needle}' before COPY of {script_rel} "
                f"(or Server/scripts / Server/). Offending instruction: {run_line}",
                file=sys.stderr,
            )
            sys.exit(1)

if not run_line:
    print(
        "check-dockerfile-web-backend-deps: backend stage never invokes "
        f"'{run_needle}' — update this check if torch install moved",
        file=sys.stderr,
    )
    sys.exit(1)

print(
    f"check-dockerfile-web-backend-deps: OK ({dockerfile} has COPY before {run_needle})"
)
PY
