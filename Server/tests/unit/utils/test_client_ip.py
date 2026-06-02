"""Tests for proxy-aware client IP resolution."""

from __future__ import annotations

from app.utils.http.client_ip import get_client_ip


def test_get_client_ip_uses_x_forwarded_for_first_hop(app):
    with app.test_request_context(
        "/",
        environ_base={"REMOTE_ADDR": "10.0.0.1"},
        headers={"X-Forwarded-For": "203.0.113.50, 10.0.0.1"},
    ):
        assert get_client_ip() == "203.0.113.50"


def test_get_client_ip_uses_x_real_ip_when_no_forwarded_for(app):
    with app.test_request_context(
        "/",
        environ_base={"REMOTE_ADDR": "10.0.0.1"},
        headers={"X-Real-IP": "198.51.100.10"},
    ):
        assert get_client_ip() == "198.51.100.10"


def test_get_client_ip_falls_back_to_remote_addr(app):
    with app.test_request_context("/", environ_base={"REMOTE_ADDR": "192.168.1.5"}):
        assert get_client_ip() == "192.168.1.5"


def test_get_client_ip_unknown_when_remote_addr_missing(app):
    with app.test_request_context("/"):
        assert get_client_ip() == "unknown"
