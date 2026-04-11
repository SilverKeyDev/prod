"""Soft signal when walkability_importance is set and listing has a walk score (0–100)."""

from __future__ import annotations

from typing import Any


def _parse_walk_score(property_dict: dict[str, Any]) -> float | None:
    raw = property_dict.get("walkability_score") or property_dict.get("walkScore")
    if raw is None:
        return None
    try:
        v = float(raw)
    except (TypeError, ValueError):
        return None
    if v < 0 or v > 100:
        return None
    return v


def soft_walkability_normalized(
    preferences: dict[str, Any], property_dict: dict[str, Any]
) -> float:
    score = _parse_walk_score(property_dict)

    imp = preferences.get("walkability_importance")
    if imp is None or not str(imp).strip():
        return 0.5

    s = str(imp).lower().strip()
    if s in ("neutral", "not_important"):
        return 0.5

    if score is None:
        return 0.5

    norm = max(0.0, min(1.0, score / 100.0))
    if s == "very_important":
        return 0.3 + 0.7 * norm
    if s == "somewhat_important":
        return 0.4 + 0.4 * norm
    return 0.5
