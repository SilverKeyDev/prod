"""Tests for Server/scripts/extract_routes.py inventory generation."""

from __future__ import annotations

from scripts.extract_routes import collect_route_entries


def test_collect_route_entries_is_sorted():
    entries = collect_route_entries()
    assert entries == sorted(entries)


def test_collect_route_entries_is_non_empty():
    entries = collect_route_entries()
    assert len(entries) > 0


def test_collect_route_entries_excludes_skip_list():
    entries = collect_route_entries()
    joined = "\n".join(entries)
    assert "GET /healthz" not in entries
    assert "GET /readyz" not in entries
    assert "GET /livez" not in entries
    assert "OPTIONS " not in joined
    assert "/assets/" not in joined
    assert "/static/" not in joined
    assert all(" /login" not in entry or entry.startswith("GET /api/") for entry in entries)
