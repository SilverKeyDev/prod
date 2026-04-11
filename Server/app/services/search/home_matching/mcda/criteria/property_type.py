"""
Normalize listing / user housing types to API buckets (mirrors preferences_helpers maps).
"""

from __future__ import annotations

from typing import Any


def _user_pref_to_api_bucket(user_type_lower: str, status_type: str) -> str | None:
    if status_type == "ForRent":
        rent_type_map = {
            "single_family": "Houses",
            "house": "Houses",
            "houses": "Houses",
            "townhouse": "Townhomes",
            "townhomes": "Townhomes",
            "condo": "Apartments_Condos_Co-ops",
            "condos": "Apartments_Condos_Co-ops",
            "condos-co-ops": "Apartments_Condos_Co-ops",
            "apartment": "Apartments_Condos_Co-ops",
            "apartments": "Apartments_Condos_Co-ops",
            "co-op": "Apartments_Condos_Co-ops",
            "coop": "Apartments_Condos_Co-ops",
        }
        return rent_type_map.get(user_type_lower)
    sale_type_map = {
        "single_family": "Houses",
        "house": "Houses",
        "houses": "Houses",
        "condo": "Condos",
        "condos": "Condos",
        "condos-co-ops": "Condos",
        "townhouse": "Townhomes",
        "townhomes": "Townhomes",
        "apartment": "Apartments",
        "apartments": "Apartments",
        "multi_family": "Multi-family",
        "multifamily": "Multi-family",
        "manufactured": "Manufactured",
        "mobile": "Manufactured",
        "land": "LotsLand",
        "lot": "LotsLand",
        "lots": "LotsLand",
        "lots-land": "LotsLand",
    }
    return sale_type_map.get(user_type_lower)


def normalize_listing_type_key(raw: Any, status_type: str) -> str | None:
    """Map Zillow-style listing type string to same bucket as user preference mapping."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    key = s.lower().replace("_", " ").replace("-", " ")

    if status_type == "ForRent":
        if "townhome" in key or "town house" in key:
            return "Townhomes"
        if "condo" in key or "co-op" in key or "coop" in key or "apartment" in key:
            return "Apartments_Condos_Co-ops"
        if "house" in key and "town" not in key:
            return "Houses"
        return None

    if "townhome" in key or "town home" in key:
        return "Townhomes"
    if "condo" in key:
        return "Condos"
    if "apartment" in key:
        return "Apartments"
    if "multi" in key:
        return "Multi-family"
    if "manufactured" in key or "mobile" in key:
        return "Manufactured"
    if "lot" in key or "land" in key:
        return "LotsLand"
    if "single" in key or key == "house" or key == "houses" or "sfh" in key:
        return "Houses"
    if key == "houses":
        return "Houses"
    return None


def _housing_pref_tokens(raw_pref: Any) -> list[str]:
    if raw_pref is None:
        return []
    s = str(raw_pref).strip()
    if not s:
        return []
    return [p.strip().lower() for p in s.split(",") if p.strip()]


def listing_matches_preferred_housing_type(
    preferences: dict[str, Any], property_dict: dict[str, Any], status_type: str
) -> bool | None:
    """
    True if any comma-separated home type matches listing bucket, False if known mismatch,
    None if preference or listing type unknown (no penalty).
    """
    raw_pref = preferences.get("preferred_housing_type") or preferences.get("housing_type")
    tokens = _housing_pref_tokens(raw_pref)
    if not tokens:
        return None

    listing_raw = (
        property_dict.get("homeType")
        or property_dict.get("propertyType")
        or property_dict.get("home_type")
        or property_dict.get("property_type")
    )
    listing_bucket = normalize_listing_type_key(listing_raw, status_type)
    if listing_bucket is None:
        return None

    buckets: set[str] = set()
    for t in tokens:
        b = _user_pref_to_api_bucket(t, status_type)
        if b:
            buckets.add(b)
    if not buckets:
        return None

    return listing_bucket in buckets
