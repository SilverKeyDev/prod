"""Tests for Server/scripts/check_dead_endpoints.py."""

from __future__ import annotations

from scripts.check_dead_endpoints import DEAD_ENDPOINT_ALLOWLIST, compute_dead_endpoints


def test_compute_dead_endpoints_subtracts_observed():
    inventory = ["GET /api/v1/foo", "POST /api/v1/bar"]
    observed = {"GET /api/v1/foo"}
    assert compute_dead_endpoints(inventory, observed) == ["POST /api/v1/bar"]


def test_compute_dead_endpoints_excludes_allowlist():
    inventory = [
        "GET /api/v1/agent/chats/stream",
        "GET /api/v1/foo",
    ]
    observed: set[str] = set()
    dead = compute_dead_endpoints(inventory, observed, allowlist=DEAD_ENDPOINT_ALLOWLIST)
    assert "GET /api/v1/agent/chats/stream" not in dead
    assert dead == ["GET /api/v1/foo"]


def test_compute_dead_endpoints_empty_when_all_observed():
    inventory = ["GET /api/v1/foo"]
    observed = {"GET /api/v1/foo"}
    assert compute_dead_endpoints(inventory, observed) == []
