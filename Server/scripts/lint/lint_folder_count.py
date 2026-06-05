#!/usr/bin/env python3
"""Entrypoint for CI discovery; implementation lives in meta/."""

import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "meta" / "lint_folder_count.py"))
