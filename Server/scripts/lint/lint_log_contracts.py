#!/usr/bin/env python3
"""CI entrypoint: lint SilverKey log paths and legacy category usage."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parents[3] / "scripts" / "log_contracts" / "lint_log_paths.py"
raise SystemExit(subprocess.call([sys.executable, str(_SCRIPT)], cwd=str(_SCRIPT.parent)))
