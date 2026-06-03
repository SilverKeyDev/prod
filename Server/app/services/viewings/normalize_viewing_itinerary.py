"""Normalize legacy calendar_events.itinerary JSON to ViewingItinerary shape (no network)."""

from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from app.schemas.generated import ViewingItinerary
from app.services.viewings.route_builder_support import (
    _endpoint_persist_dict,
    _lat_lng_pair,
    _normalize_end_mode,
    _normalize_endpoint,
    _viewing_stop_persist_dict,
)

CLASS_ALREADY_CANONICAL = "already_canonical"
CLASS_MIGRATE = "migrate"
CLASS_SKIP_AMBIGUOUS = "skip_ambiguous"
CLASS_SKIP_INVALID = "skip_invalid"

_COORD_EPS = 1e-5


def _stops_list(raw: dict[str, Any]) -> list[dict[str, Any]]:
    stops = raw.get("stops") or []
    return [s for s in stops if isinstance(s, dict)]


def _has_listing_id(stop: dict[str, Any]) -> bool:
    listing = stop.get("listing_id")
    return listing is not None and bool(str(listing).strip())


def _has_address(stop: dict[str, Any]) -> bool:
    addr = stop.get("address")
    return isinstance(addr, str) and bool(addr.strip())


def _is_anchor_like_stop(stop: dict[str, Any]) -> bool:
    if _has_listing_id(stop):
        return False
    return _normalize_endpoint(stop) is not None


def _stop_to_endpoint_row(stop: dict[str, Any]) -> dict[str, Any]:
    row = {
        "label": stop.get("label"),
        "address": stop.get("address"),
        "lat": stop.get("lat"),
        "lng": stop.get("lng"),
    }
    persisted = _endpoint_persist_dict(row)
    if persisted is None:
        raise ValueError("anchor stop could not be converted to endpoint")
    return persisted


def _endpoints_roughly_match(a: dict[str, Any], b: dict[str, Any]) -> bool:
    addr_a = (a.get("address") or "").strip()
    addr_b = (b.get("address") or "").strip()
    if addr_a and addr_b and addr_a == addr_b:
        return True
    pair_a = _lat_lng_pair(a)
    pair_b = _lat_lng_pair(b)
    if pair_a and pair_b:
        return abs(pair_a[0] - pair_b[0]) < _COORD_EPS and abs(pair_a[1] - pair_b[1]) < _COORD_EPS
    return False


def _all_stops_without_listing(stops: list[dict[str, Any]]) -> bool:
    return not any(_has_listing_id(s) for s in stops)


def _stop_is_property(stop: dict[str, Any], *, all_without_listing: bool) -> bool:
    if _has_listing_id(stop):
        return True
    if all_without_listing and _has_address(stop):
        return True
    return False


def _anchor_like_in_middle(stops: list[dict[str, Any]]) -> bool:
    if len(stops) < 3:
        return False
    for i in range(1, len(stops) - 1):
        if _is_anchor_like_stop(stops[i]) and not _stop_is_property(
            stops[i], all_without_listing=_all_stops_without_listing(stops)
        ):
            return True
    return False


def _duplicate_anchor_in_stops(raw: dict[str, Any], stops: list[dict[str, Any]]) -> bool:
    start = _normalize_endpoint(raw.get("start"))
    if not start:
        return False
    if stops and _endpoints_roughly_match(start, stops[0]):
        return True
    end = _normalize_endpoint(raw.get("end"))
    end_mode = _normalize_end_mode(raw.get("end_mode"))
    if end_mode == "fixed" and end and stops and _endpoints_roughly_match(end, stops[-1]):
        return True
    return False


def _should_promote_first_edge(stops: list[dict[str, Any]]) -> bool:
    if not stops or not _is_anchor_like_stop(stops[0]):
        return False
    all_wo = _all_stops_without_listing(stops)
    if all_wo:
        return False
    return any(
        _stop_is_property(stops[i], all_without_listing=all_wo) for i in range(1, len(stops))
    )


def _should_promote_last_edge(stops: list[dict[str, Any]]) -> bool:
    """`stops` is the working list after any start promotion (property rows only + optional end)."""
    if len(stops) < 2:
        return False
    last = stops[-1]
    if not _is_anchor_like_stop(last):
        return False
    all_wo = _all_stops_without_listing(stops)
    if all_wo:
        return False
    return any(
        _stop_is_property(stops[i], all_without_listing=all_wo) for i in range(0, len(stops) - 1)
    )


def needs_itinerary_migration(raw: dict[str, Any]) -> bool:
    return classify_itinerary(raw) == CLASS_MIGRATE


def classify_itinerary(raw: dict[str, Any]) -> str:
    if not isinstance(raw, dict):
        return CLASS_SKIP_INVALID

    stops = _stops_list(raw)
    if len(stops) < 1:
        return CLASS_SKIP_INVALID

    if _anchor_like_in_middle(stops):
        return CLASS_SKIP_AMBIGUOUS

    all_wo = _all_stops_without_listing(stops)
    property_count = sum(1 for s in stops if _stop_is_property(s, all_without_listing=all_wo))
    if property_count < 1:
        return CLASS_SKIP_AMBIGUOUS

    promote_first = _should_promote_first_edge(stops)
    promote_last = _should_promote_last_edge(stops)
    dup = _duplicate_anchor_in_stops(raw, stops)
    existing_start = _normalize_endpoint(raw.get("start"))

    if promote_first or promote_last or dup:
        try:
            normalize_viewing_itinerary(raw, clear_legs=True)
            return CLASS_MIGRATE
        except ValueError:
            return CLASS_SKIP_AMBIGUOUS

    end_mode = _normalize_end_mode(raw.get("end_mode"))
    if end_mode == "fixed" and not _normalize_endpoint(raw.get("end")):
        return CLASS_SKIP_AMBIGUOUS

    try:
        ViewingItinerary.model_validate(raw)
    except ValidationError:
        try:
            normalize_viewing_itinerary(raw, clear_legs=True)
            return CLASS_MIGRATE
        except ValueError:
            return CLASS_SKIP_INVALID

    if existing_start:
        for s in stops:
            if _is_anchor_like_stop(s) and not _has_listing_id(s):
                if _endpoints_roughly_match(existing_start, s):
                    return CLASS_MIGRATE

    return CLASS_ALREADY_CANONICAL


def normalize_viewing_itinerary(raw: dict[str, Any], *, clear_legs: bool = True) -> dict[str, Any]:
    """
    Promote edge anchor stops to start/end and return a ViewingItinerary-shaped dict.
    Raises ValueError when the row cannot be normalized safely.
    """
    if not isinstance(raw, dict):
        raise ValueError("itinerary must be a dict")

    stops = _stops_list(raw)
    if len(stops) < 1:
        raise ValueError("itinerary must have at least one stop")

    if _anchor_like_in_middle(stops):
        raise ValueError("ambiguous anchor stops in the middle of the tour")

    working = [dict(s) for s in stops]

    start_row: dict[str, Any] | None = None
    existing_start = _normalize_endpoint(raw.get("start"))
    if existing_start:
        start_row = _endpoint_persist_dict(existing_start)

    promote_first = _should_promote_first_edge(working)
    if promote_first:
        start_row = _stop_to_endpoint_row(working[0])
        working = working[1:]

    if len(working) < 1:
        raise ValueError("no property stops remain after promoting start anchor")

    promote_last = _should_promote_last_edge(working)
    end_row: dict[str, Any] | None = None
    end_mode = _normalize_end_mode(raw.get("end_mode"))

    if promote_last:
        last = working[-1]
        working = working[:-1]
        if len(working) < 1:
            raise ValueError("no property stops remain after promoting end anchor")
        if start_row and _endpoints_roughly_match(start_row, last):
            end_mode = "return_to_start"
            end_row = None
        else:
            end_mode = "fixed"
            end_row = _stop_to_endpoint_row(last)
    elif end_mode == "fixed":
        existing_end = _normalize_endpoint(raw.get("end"))
        if existing_end:
            end_row = _endpoint_persist_dict(existing_end)
        else:
            raise ValueError("end_mode is fixed but no end anchor is available")

    if start_row and working:
        if _endpoints_roughly_match(start_row, working[0]):
            working = working[1:]
            if len(working) < 1:
                raise ValueError("no property stops remain after removing duplicate start")

    if end_row and working and end_mode == "fixed":
        if _endpoints_roughly_match(end_row, working[-1]):
            working = working[:-1]
            if len(working) < 1:
                raise ValueError("no property stops remain after removing duplicate end")

    property_stops: list[dict[str, Any]] = []
    for s in working:
        if not _has_address(s):
            raise ValueError("property stop missing required address")
        property_stops.append(_viewing_stop_persist_dict(s))

    if len(property_stops) < 1:
        raise ValueError("at least one property stop is required")

    if end_mode == "fixed" and not end_row:
        raise ValueError("end_mode is fixed but end is missing")

    normalized: dict[str, Any] = {
        "stops": property_stops,
        "ordered": False if clear_legs else raw.get("ordered", False),
        "legs": None if clear_legs else raw.get("legs"),
        "start": start_row,
        "end": end_row if end_mode == "fixed" else None,
        "end_mode": end_mode,
    }

    if not start_row and end_mode in ("return_to_start", "fixed"):
        end_mode = "last_property"
        normalized["end_mode"] = end_mode
        normalized["end"] = None

    validated = ViewingItinerary.model_validate(normalized)
    return validated.model_dump(mode="json")
