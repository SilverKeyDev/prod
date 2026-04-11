"""Light soft alignment with listing_type prefs (shares heuristics with polygon post-filter)."""

from __future__ import annotations

from typing import Any

from app.services.search.helpers.listing_type_match import property_matches_listing_type_prefs


def soft_listing_type_normalized(
    preferences: dict[str, Any], property_dict: dict[str, Any]
) -> float:
    prefs = preferences.get("listing_type")
    if not prefs or not isinstance(prefs, list) or len(prefs) == 0:
        return 0.5

    if property_matches_listing_type_prefs(property_dict, prefs):
        return 0.82
    return 0.38
