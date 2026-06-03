"""Unit tests for legacy viewing itinerary normalization (no network)."""

from __future__ import annotations

import pytest

from app.schemas.generated import ViewingItinerary
from app.services.viewings.normalize_viewing_itinerary import (
    CLASS_ALREADY_CANONICAL,
    CLASS_MIGRATE,
    CLASS_SKIP_AMBIGUOUS,
    classify_itinerary,
    normalize_viewing_itinerary,
)
from app.services.viewings.route_builder import itinerary_path_coordinates


def test_legacy_stops_only_two_properties_already_canonical() -> None:
    raw = {
        "stops": [
            {"address": "A", "lat": 1.0, "lng": 2.0},
            {"address": "B", "lat": 3.0, "lng": 4.0},
        ]
    }
    assert classify_itinerary(raw) == CLASS_ALREADY_CANONICAL
    normalized = normalize_viewing_itinerary(raw)
    assert itinerary_path_coordinates(raw) == itinerary_path_coordinates(normalized)
    ViewingItinerary.model_validate(normalized)


def test_anchor_in_stops_office_two_listings_dinner() -> None:
    raw = {
        "stops": [
            {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
            {"address": "A", "lat": 1.0, "lng": 1.0, "listing_id": "z1"},
            {"address": "B", "lat": 2.0, "lng": 2.0, "listing_id": "z2"},
            {"label": "Dinner", "address": "D", "lat": 5.0, "lng": 5.0},
        ]
    }
    assert classify_itinerary(raw) == CLASS_MIGRATE
    out = normalize_viewing_itinerary(raw)
    assert out["start"] == {
        "label": "Office",
        "address": "O",
        "lat": 0.0,
        "lng": 0.0,
    }
    assert out["end_mode"] == "fixed"
    assert out["end"] == {
        "label": "Dinner",
        "address": "D",
        "lat": 5.0,
        "lng": 5.0,
    }
    assert len(out["stops"]) == 2
    assert out["stops"][0]["listing_id"] == "z1"
    assert out["legs"] is None
    assert itinerary_path_coordinates(raw) == itinerary_path_coordinates(out)
    ViewingItinerary.model_validate(out)


def test_return_to_start_anchor_in_stops() -> None:
    raw = {
        "stops": [
            {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
            {"address": "A", "lat": 1.0, "lng": 1.0, "listing_id": "z1"},
            {"label": "Office return", "address": "O", "lat": 0.0, "lng": 0.0},
        ]
    }
    assert classify_itinerary(raw) == CLASS_MIGRATE
    out = normalize_viewing_itinerary(raw)
    assert out["start"]["address"] == "O"
    assert out["end_mode"] == "return_to_start"
    assert out["end"] is None
    assert len(out["stops"]) == 1
    assert itinerary_path_coordinates(raw) == itinerary_path_coordinates(out)


def test_explicit_start_removes_duplicate_first_stop() -> None:
    raw = {
        "start": {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
        "stops": [
            {"label": "Office dup", "address": "O", "lat": 0.0, "lng": 0.0},
            {"address": "A", "lat": 1.0, "lng": 1.0, "listing_id": "z1"},
        ],
        "end_mode": "last_property",
    }
    assert classify_itinerary(raw) == CLASS_MIGRATE
    out = normalize_viewing_itinerary(raw)
    assert len(out["stops"]) == 1
    assert out["stops"][0]["listing_id"] == "z1"
    assert out["start"]["address"] == "O"


def test_explicit_start_already_canonical() -> None:
    raw = {
        "start": {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
        "stops": [
            {"address": "A", "lat": 1.0, "lng": 1.0, "listing_id": "z1"},
            {"address": "B", "lat": 2.0, "lng": 2.0, "listing_id": "z2"},
        ],
        "end_mode": "last_property",
    }
    assert classify_itinerary(raw) == CLASS_ALREADY_CANONICAL


def test_ambiguous_anchor_in_middle() -> None:
    raw = {
        "stops": [
            {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
            {"label": "Lunch", "address": "L", "lat": 1.0, "lng": 1.0},
            {"address": "A", "lat": 2.0, "lng": 2.0, "listing_id": "z1"},
        ]
    }
    assert classify_itinerary(raw) == CLASS_SKIP_AMBIGUOUS
    with pytest.raises(ValueError):
        normalize_viewing_itinerary(raw)


def test_ambiguous_two_anchors_no_property_listings() -> None:
    """Two edge anchors and no listing-backed property stops cannot be promoted safely."""
    raw = {
        "stops": [
            {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
            {"label": "Dinner", "address": "D", "lat": 5.0, "lng": 5.0},
        ]
    }
    # No listing_id on any stop — treated as legacy property-only tour (canonical).
    assert classify_itinerary(raw) == CLASS_ALREADY_CANONICAL
