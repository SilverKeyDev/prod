#!/usr/bin/env python3
"""Entrypoint for CI discovery; implementation lives in contracts/."""

import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "contracts" / "lint_log_contracts.py"))
