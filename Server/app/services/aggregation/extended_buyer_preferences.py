"""Validate and merge extended_buyer_preferences (v1) for UserSearchIntent JSON storage."""

from __future__ import annotations

import json
from typing import Any

EXTENSION_VERSION = 1

VALID_SECTIONS = frozenset(
    {
        "price_financing",
        "location_prefs",
        "physical",
        "condition",
        "utilities",
        "neighborhood",
    }
)

IMPORTANCE_VALUES = frozenset(
    {
        "not_important",
        "somewhat_important",
        "neutral",
        "very_important",
    }
)


def _bool(v: Any) -> bool | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "1", "yes"):
            return True
        if s in ("false", "0", "no"):
            return False
    return None


def _int_clamped(v: Any, lo: int, hi: int) -> int | None:
    if v is None:
        return None
    try:
        n = int(v)
    except (TypeError, ValueError):
        return None
    return max(lo, min(hi, n))


def _str_list(v: Any, *, max_items: int = 24, max_len: int = 80) -> list[str]:
    if not isinstance(v, list):
        return []
    out: list[str] = []
    for item in v[:max_items]:
        s = str(item).strip()[:max_len]
        if s:
            out.append(s)
    return out


def _importance(v: Any) -> str | None:
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in IMPORTANCE_VALUES:
        return s
    return None


def _short_str(v: Any, max_len: int = 120) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    return s[:max_len]


def sanitize_section(section: str, data: Any) -> dict[str, Any] | None:
    if not isinstance(data, dict):
        return None
    if section == "price_financing":
        out: dict[str, Any] = {}
        b = _bool(data.get("hoa_ok"))
        if b is not None:
            out["hoa_ok"] = b
        h = _int_clamped(data.get("hoa_fee_max_monthly"), 0, 50_000)
        if h is not None:
            out["hoa_fee_max_monthly"] = h
        return out or None
    if section == "location_prefs":
        out = {}
        for key in ("flood_importance", "noise_importance"):
            im = _importance(data.get(key))
            if im:
                out[key] = im
        return out or None
    if section == "physical":
        out = {}
        b = _bool(data.get("garage_required"))
        if b is not None:
            out["garage_required"] = b
        c = _int_clamped(data.get("garage_min_cars"), 0, 6)
        if c is not None:
            out["garage_min_cars"] = c
        for key in (
            "stories_preference",
            "parking_type",
            "accessibility_needs",
            "outdoor_space_importance",
            "fireplace_preference",
            "view_importance",
        ):
            s = _short_str(data.get(key), 80)
            if s:
                out[key] = s
        return out or None
    if section == "condition":
        out = {}
        for key in (
            "prefer_price_reduced",
            "prefer_virtual_tour",
            "prefer_open_house",
            "foreclosure_ok",
        ):
            b = _bool(data.get(key))
            if b is not None:
                out[key] = b
        return out or None
    if section == "utilities":
        out = {}
        hv = _short_str(data.get("hvac_preference"), 80)
        if hv:
            out["hvac_preference"] = hv
        ui = _importance(data.get("utilities_included_importance"))
        if ui:
            out["utilities_included_importance"] = ui
        for key in ("solar_interest", "ev_charger_interest"):
            im = _importance(data.get(key))
            if im:
                out[key] = im
        return out or None
    if section == "neighborhood":
        out = {}
        walkability_importance = _importance(data.get("walkability_importance"))
        if walkability_importance:
            out["walkability_importance"] = walkability_importance
        for key in ("crime_importance", "pet_friendly_area"):
            im = _importance(data.get(key))
            if im:
                out[key] = im
        return out or None
    return None


def coerce_extension_value(raw: Any) -> dict[str, Any] | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def normalize_stored_document(doc: dict[str, Any]) -> dict[str, Any]:
    """Return a v1 document with only known sections and sanitized values."""
    sections: dict[str, Any] = {}
    for key in VALID_SECTIONS:
        if key not in doc:
            continue
        sanitized = sanitize_section(key, doc[key])
        if sanitized:
            sections[key] = sanitized
    out: dict[str, Any] = {"v": EXTENSION_VERSION}
    for key in sorted(sections.keys()):
        out[key] = sections[key]
    return out


def merge_extended_buyer_preferences(existing: Any, incoming: Any) -> dict[str, Any] | None:
    """
    Deep-merge incoming sections into existing stored JSON.
    Unknown top-level keys (except v) are ignored. Empty dict for a section clears it.
    Returns None when there is nothing left to store (clears column).
    """
    base: dict[str, dict[str, Any]] = {}
    prev = coerce_extension_value(existing)
    if isinstance(prev, dict):
        for k in VALID_SECTIONS:
            sub = prev.get(k)
            if isinstance(sub, dict):
                base[k] = dict(sub)

    inc = coerce_extension_value(incoming)
    if not isinstance(inc, dict):
        doc = normalize_stored_document(dict(base))
        return doc if len(doc) > 1 else None

    for k, v in inc.items():
        if k == "v" or k not in VALID_SECTIONS:
            continue
        if isinstance(v, dict) and len(v) == 0:
            base.pop(k, None)
            continue
        sanitized = sanitize_section(k, v)
        if sanitized is None:
            base.pop(k, None)
            continue
        if k in ("location_prefs", "neighborhood"):
            # Replace section to allow deprecated keys to be removed.
            base[k] = sanitized
            continue
        prev_sec = base.get(k, {})
        merged = {**prev_sec, **sanitized}
        base[k] = merged

    doc = normalize_stored_document({key: base[key] for key in base})
    return doc if len(doc) > 1 else None


LISTING_STATUS_ALIASES: dict[str, str] = {
    "all": "",
    "any": "",
    "for_sale": "active",
    "forsale": "active",
    "active": "active",
    "pending": "pending",
    "sold": "sold",
    "coming_soon": "coming_soon",
    "coming soon": "coming_soon",
    "contingent": "contingent",
}

LISTING_STATUS_CANONICAL = frozenset({"active", "pending", "sold", "coming_soon", "contingent"})


def normalize_listing_status(raw: Any) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip().lower().replace(" ", "_")
    if not s:
        return None
    mapped = LISTING_STATUS_ALIASES.get(s, s)
    if not mapped:
        return None
    if mapped in LISTING_STATUS_CANONICAL:
        return mapped
    return None


def apply_extended_buyer_preference_canonical_keys(out: dict[str, Any]) -> None:
    """Mirror nested extension fields to flat keys for search/MCDA consumers."""
    ext = out.get("extended_buyer_preferences")
    if not isinstance(ext, dict):
        return
    n = ext.get("neighborhood")
    if isinstance(n, dict) and n.get("walkability_importance") is not None:
        importance = _importance(n.get("walkability_importance"))
        if importance:
            out["walkability_importance"] = importance
