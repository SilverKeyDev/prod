"""
Pydantic validation models auto-generated from openapi.yaml.

DO NOT add types here manually. To add/modify schemas:
1. Edit openapi.yaml (repo root)
2. Run: cd Server && bash scripts/generate-pydantic-models.sh
3. Types regenerated in schemas/generated.py

This package provides runtime request/response validation for Flask routes.
"""

from .generated import *  # noqa: F403

__all__ = ["generated"]  # noqa: F405
