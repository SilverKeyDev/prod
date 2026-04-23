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


def _endpoint_line(prefix: str, stop: dict[str, Any]) -> str:
    label = stop.get("label") or stop.get("address") or prefix
    addr = stop.get("address")
    if addr and addr != label:
        return f"{prefix}: {label} — {addr}"
    return f"{prefix}: {label}"


def format_itinerary_text_block(stops: list[dict[str, Any]]) -> str:
    """Format property stops only (legacy helper). Prefer format_itinerary_text_block_from_plain."""
    lines: list[str] = []
    for i, stop in enumerate(stops, start=1):
        label = stop.get("label") or stop.get("address") or f"Stop {i}"
        addr = stop.get("address")
        if addr and addr != label:
            lines.append(f"{i}. {label} — {addr}")
        else:
            lines.append(f"{i}. {label}")
    return "\n".join(lines)


def format_itinerary_text_block_from_plain(itinerary: dict[str, Any]) -> str:
    """Human-readable itinerary including optional start/end anchors."""
    lines: list[str] = []
    start = itinerary.get("start")
    if isinstance(start, dict) and any(
        start.get(k) not in (None, "") for k in ("label", "address", "lat", "lng")
    ):
        lines.append(_endpoint_line("Start", start))

    stops = [s for s in (itinerary.get("stops") or []) if isinstance(s, dict)]
    for i, stop in enumerate(stops, start=1):
        label = stop.get("label") or stop.get("address") or f"Property {i}"
        addr = stop.get("address")
        if addr and addr != label:
            lines.append(f"{i}. {label} — {addr}")
        else:
            lines.append(f"{i}. {label}")

    end_mode = itinerary.get("end_mode") or "last_property"
    if end_mode == "last_property":
        lines.append("End: Last property")
    elif end_mode == "return_to_start":
        lines.append("End: Return to start")
    elif end_mode == "fixed":
        end = itinerary.get("end")
        if isinstance(end, dict) and any(
            end.get(k) not in (None, "") for k in ("label", "address", "lat", "lng")
        ):
            lines.append(_endpoint_line("End", end))
        else:
            lines.append("End: Fixed location")

    return "\n".join(lines)


def merge_viewing_itinerary_into_event_data(
    event_data: dict[str, Any],
    itinerary: Any,
) -> None:
    """
    Mutate event_data in place: set location to meet-up (start) when set, else first property;
    append itinerary block to description.
    """
    plain = _itinerary_to_plain_dict(itinerary)
    if not plain:
        return
    stops = plain.get("stops") or []
    if not stops:
        return

    start = plain.get("start")
    if isinstance(start, dict):
        loc = start.get("label") or start.get("address")
        if loc:
            event_data["location"] = loc
    if not event_data.get("location"):
        first = stops[0]
        if isinstance(first, dict):
            loc = first.get("label") or first.get("address")
            if loc:
                event_data["location"] = loc

    base = (Config.FRONTEND_URL or "").rstrip("/")
    deep_link = f"{base}/dashboard" if base else ""
    block = format_itinerary_text_block_from_plain(plain)
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


def _normalize_stop_dict(s: Any) -> dict[str, Any]:
    if hasattr(s, "model_dump"):
        return s.model_dump(mode="json")
    if isinstance(s, dict):
        return dict(s)
    return {}


def resolve_itinerary_with_route(itinerary: dict[str, Any] | None) -> dict[str, Any] | None:
    """
    When routing is needed, compute driving order and legs (server-side).
    Skips when there is only one property stop and no start anchor (nothing to reorder).
    """
    if not itinerary:
        return None

    from app.services.viewings.route_builder import _normalize_endpoint, build_viewing_route

    stops = itinerary.get("stops") or []
    if len(stops) < 1:
        return itinerary

    start_ep = _normalize_endpoint(itinerary.get("start"))
    if len(stops) < 2 and not start_ep:
        return itinerary

    as_dicts = [_normalize_stop_dict(s) for s in stops]
    payload: dict[str, Any] = {"stops": as_dicts}

    if start_ep:
        payload["start"] = _normalize_stop_dict(itinerary.get("start"))

    if _normalize_endpoint(itinerary.get("end")):
        payload["end"] = _normalize_stop_dict(itinerary.get("end"))

    end_mode = itinerary.get("end_mode")
    if end_mode is not None:
        payload["end_mode"] = end_mode.value if hasattr(end_mode, "value") else end_mode

    opt = itinerary.get("optimize_order")
    if opt is not None:
        payload["optimize_order"] = opt

    return build_viewing_route(payload)
