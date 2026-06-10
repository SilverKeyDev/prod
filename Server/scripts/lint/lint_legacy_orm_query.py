#!/usr/bin/env python3
"""Entrypoint for CI discovery; implementation lives in db/."""

import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).resolve().parent / "db" / "lint_legacy_orm_query.py"))
