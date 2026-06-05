#!/usr/bin/env python3
"""Entrypoint for CI discovery; implementation lives in openapi/."""

import runpy
from pathlib import Path

runpy.run_path(
    str(Path(__file__).resolve().parent / "openapi" / "lint_openapi_validation_coverage.py")
)
