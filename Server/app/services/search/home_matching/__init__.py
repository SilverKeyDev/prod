"""
Home Matching System

A comprehensive property matching system that combines:
- Embedding-based similarity scoring
- Tabular model predictions (XGBoost/LightGBM)
- LLM-based scoring and justification

The system takes user preferences and home data to produce ranked matches
with explainable scoring across multiple methodologies.
"""

from __future__ import annotations

from typing import Any

__version__ = "1.0.0"
__author__ = "SilverKey Team"

__all__ = [
    "find_best_matches",
]

_LAZY_EXPORT_NAMES = frozenset(__all__)


def __getattr__(name: str) -> Any:
    if name not in _LAZY_EXPORT_NAMES:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    from .config import match as _match

    return getattr(_match, name)


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(__all__))
