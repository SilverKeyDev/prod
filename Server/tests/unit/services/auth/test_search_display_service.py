"""Unit tests for search display service helpers."""

from app.services.auth.search_display.service import sanitize_last_search_context


def test_sanitize_last_search_context_preserves_fractional_zoom():
    result = sanitize_last_search_context({"map_zoom": 12.7, "search_source": "location"})
    assert result is not None
    assert result["map_zoom"] == 12.7
    assert result["search_source"] == "location"


def test_sanitize_last_search_context_clamps_zoom_below_minimum():
    result = sanitize_last_search_context({"map_zoom": 0.5, "search_source": "preferences"})
    assert result is not None
    assert result["map_zoom"] == 1.0


def test_sanitize_last_search_context_clamps_zoom_above_maximum():
    result = sanitize_last_search_context({"map_zoom": 25.0, "search_source": "location"})
    assert result is not None
    assert result["map_zoom"] == 22.0
