"""Merge multi-stop viewing itineraries into Google Calendar event fields and DB."""

from __future__ import annotations

from typing import Any

from app.config import Config


def _itinerary_to_plain_dict(itinerary: Any) -> dict[str, Any] | None:
    if itinerary is None:
        return None
    if hasattr(itinerary, "model_dump"):
        return itinerary.model_dump(mode="json")
    if isinstance(itinerary, dict):
        return dict(itinerary)
    return None


def format_itinerary_text_block(stops: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for i, stop in enumerate(stops, start=1):
        label = stop.get("label") or stop.get("address") or f"Stop {i}"
        addr = stop.get("address")
        if addr and addr != label:
            lines.append(f"{i}. {label} — {addr}")
        else:
            lines.append(f"{i}. {label}")
    return "\n".join(lines)


def merge_viewing_itinerary_into_event_data(
    event_data: dict[str, Any],
    itinerary: Any,
) -> None:
    """
    Mutate event_data in place: set location to first stop; append itinerary block to description.
    """
    plain = _itinerary_to_plain_dict(itinerary)
    if not plain:
        return
    stops = plain.get("stops") or []
    if not stops:
        return
    first = stops[0]
    if isinstance(first, dict):
        loc = first.get("label") or first.get("address")
        if loc:
            event_data["location"] = loc

    base = (Config.FRONTEND_URL or "").rstrip("/")
    deep_link = f"{base}/dashboard" if base else ""
    block = format_itinerary_text_block([s for s in stops if isinstance(s, dict)])
    suffix_parts = ["\n\n---\nItinerary:\n", block]
    if deep_link:
        suffix_parts.append(f"\n\nView in SilverKey: {deep_link}")
    suffix = "".join(suffix_parts)

    existing = event_data.get("description")
    if existing and str(existing).strip():
        event_data["description"] = f"{existing}{suffix}"
    else:
        event_data["description"] = suffix.lstrip()


def itinerary_for_db(itinerary: Any) -> dict[str, Any] | None:
    """Normalize itinerary for JSON column storage."""
    return _itinerary_to_plain_dict(itinerary)


def resolve_itinerary_with_route(itinerary: dict[str, Any] | None) -> dict[str, Any] | None:
    """
    For 2+ stops, compute fastest driving order and legs (server-side).
    Single-stop itineraries are returned unchanged.
    """
    if not itinerary:
        return None
    stops = itinerary.get("stops") or []
    if len(stops) < 2:
        return itinerary

    from app.services.viewings.route_builder import build_viewing_route

    as_dicts: list[dict[str, Any]] = []
    for s in stops:
        if hasattr(s, "model_dump"):
            as_dicts.append(s.model_dump(mode="json"))
        elif isinstance(s, dict):
            as_dicts.append(dict(s))
    return build_viewing_route(as_dicts)
