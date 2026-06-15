"""Tests for Flask route rule normalization."""

from __future__ import annotations

from app.utils.http.route_pattern import normalize_flask_route_rule


def test_normalize_int_converter():
    assert normalize_flask_route_rule("/api/v1/users/<int:user_id>") == "/api/v1/users/{user_id}"


def test_normalize_plain_param():
    assert normalize_flask_route_rule("/r/<link_id>") == "/r/{link_id}"


def test_normalize_path_converter():
    assert normalize_flask_route_rule("/assets/<path:filename>") == "/assets/{filename}"


def test_normalize_static_path_unchanged():
    assert normalize_flask_route_rule("/api/v1/feed") == "/api/v1/feed"
