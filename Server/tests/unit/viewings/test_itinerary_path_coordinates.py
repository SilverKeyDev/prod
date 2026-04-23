"""Unit tests for itinerary coordinate expansion (no Google calls)."""

from __future__ import annotations

from app.services.viewings.route_builder import itinerary_path_coordinates


def test_legacy_stops_only_two_properties() -> None:
    it = {
        "stops": [
            {"address": "A", "lat": 1.0, "lng": 2.0},
            {"address": "B", "lat": 3.0, "lng": 4.0},
        ]
    }
    coords = itinerary_path_coordinates(it)
    assert coords == [(1.0, 2.0), (3.0, 4.0)]


def test_explicit_start_and_last_property() -> None:
    it = {
        "start": {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
        "stops": [
            {"address": "A", "lat": 1.0, "lng": 1.0},
            {"address": "B", "lat": 2.0, "lng": 2.0},
        ],
        "end_mode": "last_property",
    }
    coords = itinerary_path_coordinates(it)
    assert coords == [(0.0, 0.0), (1.0, 1.0), (2.0, 2.0)]


def test_return_to_start_appends_start() -> None:
    it = {
        "start": {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
        "stops": [{"address": "A", "lat": 1.0, "lng": 1.0}],
        "end_mode": "return_to_start",
    }
    coords = itinerary_path_coordinates(it)
    assert coords == [(0.0, 0.0), (1.0, 1.0), (0.0, 0.0)]


def test_fixed_end() -> None:
    it = {
        "start": {"label": "Office", "address": "O", "lat": 0.0, "lng": 0.0},
        "stops": [{"address": "A", "lat": 1.0, "lng": 1.0}],
        "end": {"label": "Dinner", "address": "D", "lat": 5.0, "lng": 5.0},
        "end_mode": "fixed",
    }
    coords = itinerary_path_coordinates(it)
    assert coords == [(0.0, 0.0), (1.0, 1.0), (5.0, 5.0)]
