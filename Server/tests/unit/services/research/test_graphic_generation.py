"""Unit tests for research map generation helpers."""

from unittest.mock import patch

from app.services.research.graphs.map_generation import (
    _parse_address_line,
    fetch_directions_leg,
    generate_static_map_url,
)


def test_parse_address_line_parses_standard_us_address():
    parsed = _parse_address_line("935 Cumberland Rd NE, Atlanta, GA 30306")
    assert parsed == ("935 Cumberland Rd NE", "Atlanta", "GA", "30306")


def test_parse_address_line_returns_none_for_invalid_input():
    assert _parse_address_line("not an address") is None


def test_fetch_directions_leg_returns_none_without_api_key():
    assert fetch_directions_leg("origin", "destination", "") is None


def test_generate_static_map_url_includes_primary_marker_and_map_id():
    with patch(
        "app.services.research.graphs.map_generation.fetch_route_polyline",
        return_value="encoded-polyline",
    ):
        url = generate_static_map_url(
            "123 Main St, Atlanta, GA",
            [{"name": "Work", "address": "456 Office Blvd, Atlanta, GA"}],
            "test-api-key",
        )
    assert url.startswith("https://maps.googleapis.com/maps/api/staticmap?")
    assert "map_id=" in url
    assert "123 Main St, Atlanta, GA" in url
    assert "enc:encoded-polyline" in url
