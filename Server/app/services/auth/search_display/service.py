"""Search display settings read/write."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models.user.user_search_display import RESULTS_ORDER_BY_ALLOWED, UserSearchDisplaySettings
from app.utils.db import db_transaction

MAP_HOME_CARDS_MIN = 1
MAP_HOME_CARDS_MAX = 5
DEFAULT_ORDER_BY = "match_score"

LAST_SEARCH_CONTEXT_ALLOWED_KEYS = frozenset(
    {"search_source", "viewport_ring", "place_label", "map_center", "map_zoom", "searched_at"}
)
LAST_SEARCH_CONTEXT_SOURCES = frozenset({"preferences", "location"})


def sanitize_last_search_context(raw: Any) -> dict[str, Any] | None:
    """Validate and sanitize the last_search_context payload. Returns None on invalid input."""
    if raw is None:
        return None
    if not isinstance(raw, dict):
        return None
    out: dict[str, Any] = {}
    for key in LAST_SEARCH_CONTEXT_ALLOWED_KEYS:
        if key in raw:
            out[key] = raw[key]
    if out.get("search_source") and out["search_source"] not in LAST_SEARCH_CONTEXT_SOURCES:
        out["search_source"] = "preferences"
    ring = out.get("viewport_ring")
    if ring is not None:
        if not isinstance(ring, list) or len(ring) < 3:
            out.pop("viewport_ring", None)
        else:
            sanitized = []
            for pt in ring:
                if isinstance(pt, dict) and "lat" in pt and "lng" in pt:
                    try:
                        sanitized.append({"lat": float(pt["lat"]), "lng": float(pt["lng"])})
                    except (TypeError, ValueError):
                        continue
            out["viewport_ring"] = sanitized if len(sanitized) >= 3 else None
    center = out.get("map_center")
    if center is not None:
        if isinstance(center, dict) and "lat" in center and "lng" in center:
            try:
                out["map_center"] = {"lat": float(center["lat"]), "lng": float(center["lng"])}
            except (TypeError, ValueError):
                out.pop("map_center", None)
        else:
            out.pop("map_center", None)
    zoom = out.get("map_zoom")
    if zoom is not None:
        try:
            out["map_zoom"] = max(1.0, min(22.0, float(zoom)))
        except (TypeError, ValueError):
            out.pop("map_zoom", None)
    return out if out else None


def row_to_dict(row: UserSearchDisplaySettings) -> dict[str, Any]:
    return {
        "show_commute_overlay": bool(row.show_commute_overlay),
        "map_home_cards_count": int(row.map_home_cards_count),
        "results_order_by": str(row.results_order_by or DEFAULT_ORDER_BY),
        "preferences_strict_filter": bool(getattr(row, "preferences_strict_filter", False)),
        "last_search_context": getattr(row, "last_search_context", None),
    }


def get_or_create_search_display(user_id: str) -> UserSearchDisplaySettings:
    row = db.session.scalar(
        select(UserSearchDisplaySettings).where(UserSearchDisplaySettings.user_id == user_id)
    )
    if row is None:
        row = UserSearchDisplaySettings(
            user_id=user_id,
            show_commute_overlay=True,
            map_home_cards_count=1,
            results_order_by=DEFAULT_ORDER_BY,
            preferences_strict_filter=False,
        )
        with db_transaction():
            db.session.add(row)
    return row


class SearchDisplayPatchError(ValueError):
    """Validation error for search display patch fields."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def apply_search_display_patch(user_id: str, body: dict[str, Any]) -> UserSearchDisplaySettings:
    """Apply partial patch; raises SearchDisplayPatchError on invalid fields."""
    row = get_or_create_search_display(user_id)
    if "show_commute_overlay" in body:
        v = body["show_commute_overlay"]
        if v is None:
            raise SearchDisplayPatchError("show_commute_overlay cannot be null")
        row.show_commute_overlay = bool(v)
    if "map_home_cards_count" in body:
        v = body["map_home_cards_count"]
        if v is None:
            raise SearchDisplayPatchError("map_home_cards_count cannot be null")
        try:
            n = int(v)
        except (TypeError, ValueError) as exc:
            raise SearchDisplayPatchError("map_home_cards_count must be an integer") from exc
        if n < MAP_HOME_CARDS_MIN or n > MAP_HOME_CARDS_MAX:
            raise SearchDisplayPatchError(
                f"map_home_cards_count must be between {MAP_HOME_CARDS_MIN} and {MAP_HOME_CARDS_MAX}"
            )
        row.map_home_cards_count = n
    if "results_order_by" in body:
        v = body["results_order_by"]
        if v is None or (isinstance(v, str) and not v.strip()):
            raise SearchDisplayPatchError("results_order_by cannot be empty")
        key = str(v).strip().lower()
        if key not in RESULTS_ORDER_BY_ALLOWED:
            raise SearchDisplayPatchError("Invalid results_order_by")
        row.results_order_by = key
    if "preferences_strict_filter" in body:
        v = body["preferences_strict_filter"]
        if v is None:
            raise SearchDisplayPatchError("preferences_strict_filter cannot be null")
        row.preferences_strict_filter = bool(v)
    if "last_search_context" in body:
        raw_ctx = body["last_search_context"]
        if raw_ctx is None:
            row.last_search_context = None
        else:
            sanitized = sanitize_last_search_context(raw_ctx)
            if sanitized is None:
                raise SearchDisplayPatchError("Invalid last_search_context")
            row.last_search_context = sanitized

    with db_transaction():
        db.session.add(row)
    return row
