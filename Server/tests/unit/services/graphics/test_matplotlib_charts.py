"""Unit tests for shared matplotlib chart generators."""

from app.services.graphics import (
    generate_donut_chart,
    generate_horizontal_bar_chart,
    generate_vertical_lollipop_chart,
)


def test_generate_horizontal_bar_chart_returns_png_buffer():
    result = generate_horizontal_bar_chart({"a": "10%", "b": "20%"}, "Test Chart")
    assert result is not None
    assert result.getvalue()[:8] == b"\x89PNG\r\n\x1a\n"


def test_generate_vertical_lollipop_chart_returns_png_buffer():
    result = generate_vertical_lollipop_chart({"0-19": "15%", "20-34": "25%"}, "Age")
    assert result is not None
    assert result.getvalue()[:8] == b"\x89PNG\r\n\x1a\n"


def test_generate_horizontal_bar_chart_empty_data_returns_none():
    assert generate_horizontal_bar_chart({}, "Empty") is None


def test_generate_donut_chart_invalid_data_returns_none():
    assert generate_donut_chart({"a": "not-a-number"}, "Bad") is None
