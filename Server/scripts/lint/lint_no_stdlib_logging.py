#!/usr/bin/env python3
"""Entrypoint for CI discovery; implementation lives in quality/."""

import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "quality" / "lint_no_stdlib_logging.py"))
