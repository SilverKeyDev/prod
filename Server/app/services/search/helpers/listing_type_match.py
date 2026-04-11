"""
Map profile listing_type preference keys (e.g. agent_listed) to upstream listing payloads.

Profile values align with Client/packages/features/profile/utils/constants.ts LISTING_TYPE_OPTIONS.
API homes expose listingStatus (e.g. for_sale) which does not substring-match those keys.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

# Normalized statuses treated as typical MLS / agent-marketed active pipeline
_AGENT_LISTED_STATUSES: frozenset[str] = frozenset(
    {
        "for_sale",
        "active",
        "pending",
        "contingent",
        "coming_soon",
        "under_contract",
        "under_contract_backup",
        "active_under_contract",
    }
)

# Statuses that are clearly not an active agent listing preference match
_EXCLUDED_FROM_AGENT_LISTED: frozenset[str] = frozenset(
    {
        "sold",
        "off_market",
        "expired",
        "withdrawn",
        "canceled",
        "cancelled",
        "deleted",
        "rented",
        "leased",
    }
)


def _normalize_token(value: str) -> str:
    return str(value).lower().replace(" ", "_").replace("-", "_")


def _listing_status_norm(prop: dict[str, Any]) -> str:
    raw = prop.get("listingStatus") or prop.get("listing_status") or ""
    return _normalize_token(str(raw).strip()) if raw else ""


def _collect_searchable_text(prop: dict[str, Any]) -> str:
    """Lowercase blob from non-address fields for keyword heuristics (no PII logging here)."""
    parts: list[str] = []

    desc = prop.get("description")
    if desc:
        parts.append(str(desc).lower())

    for key in ("listingType", "listing_type", "homeStatus", "home_type", "propertyType"):
        v = prop.get(key)
        if v is not None:
            parts.append(str(v).lower())

    for container_key in ("homeFacts", "resoFacts", "features"):
        block = prop.get(container_key)
        if isinstance(block, dict):
            parts.extend(str(v).lower() for v in block.values() if v)
        elif isinstance(block, list):
            parts.extend(str(x).lower() for x in block)
        elif block is not None:
            parts.append(str(block).lower())

    att = prop.get("attributionInfo")
    if isinstance(att, dict):
        for v in att.values():
            if v is not None:
                parts.append(str(v).lower())

    return " ".join(parts)


def _year_built_int(prop: dict[str, Any]) -> int | None:
    raw = prop.get("yearBuilt") or prop.get("year_built")
    if raw is None:
        return None
    try:
        return int(float(str(raw).strip()))
    except (TypeError, ValueError):
        return None


def _pref_matches(
    prop: dict[str, Any],
    status_norm: str,
    text_blob: str,
    pref_norm: str,
) -> bool:
    if pref_norm == "agent_listed":
        if status_norm in _EXCLUDED_FROM_AGENT_LISTED:
            return False
        return status_norm in _AGENT_LISTED_STATUSES

    if pref_norm == "owner_posted":
        if "fsbo" in text_blob or "for_sale_by_owner" in text_blob.replace(" ", "_"):
            return True
        if "for sale by owner" in text_blob:
            return True
        lt = _normalize_token(str(prop.get("listingType") or prop.get("listing_type") or ""))
        return "fsbo" in lt or "by_owner" in lt

    if pref_norm == "new_construction":
        if "new_construction" in status_norm or "new_construction" in text_blob.replace(" ", "_"):
            return True
        if "new construction" in text_blob:
            return True
        y = _year_built_int(prop)
        if y is not None:
            current_year = datetime.now(tz=timezone.utc).year
            if y >= current_year - 2:
                return True
        return False

    if pref_norm == "foreclosure_action":
        keys = ("foreclosure", "auction", "notice", "default")
        return any(k in status_norm for k in keys) or any(k in text_blob for k in keys)

    if pref_norm == "foreclosed":
        for token in ("foreclosed", "reo", "bank_owned", "repossessed"):
            if token in status_norm:
                return True
        if "bank owned" in text_blob or "foreclosed" in text_blob:
            return True
        return False

    if pref_norm == "pre_foreclosed":
        if "pre_foreclosure" in status_norm or "preforeclosure" in status_norm.replace("_", ""):
            return True
        return (
            "pre-foreclosure" in text_blob
            or "pre foreclosure" in text_blob
            or "preforeclosure" in text_blob.replace(" ", "")
        )

    # Unknown pref: preserve legacy substring behavior between pref and status
    return pref_norm in status_norm or status_norm in pref_norm


def listing_type_prefs_are_owner_posted_only(prefs: list[Any]) -> bool:
    """
    True when every non-empty preference normalizes to owner_posted.

    Used to detect FSBO-only filters: upstream MLS rows are usually listingStatus=for_sale
    without FSBO markers, so a hard filter would incorrectly return an empty list.
    """
    norms: list[str] = []
    for pref in prefs:
        s = str(pref).strip()
        if not s:
            continue
        n = _normalize_token(s)
        if n:
            norms.append(n)
    return bool(norms) and all(n == "owner_posted" for n in norms)


def property_matches_listing_type_prefs(prop: dict[str, Any], prefs: list[Any]) -> bool:
    """
    True if the property satisfies at least one listing_type preference.

    Empty or missing listingStatus passes through (keeps listings when upstream omits status).
    """
    status_norm = _listing_status_norm(prop)
    if not status_norm:
        return True

    text_blob = _collect_searchable_text(prop)

    for pref in prefs:
        pref_norm = _normalize_token(str(pref).strip())
        if not pref_norm:
            continue
        if _pref_matches(prop, status_norm, text_blob, pref_norm):
            return True

    return False
