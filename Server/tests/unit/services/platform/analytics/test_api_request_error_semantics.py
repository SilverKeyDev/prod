"""Tests for api_request error_kind classification."""

from __future__ import annotations

from app.services.analytics.api_request_error_semantics import (
    ERROR_KIND_AUTH,
    ERROR_KIND_FORBIDDEN,
    ERROR_KIND_NONE,
    ERROR_KIND_NOT_FOUND,
    ERROR_KIND_RATE_LIMITED,
    ERROR_KIND_SERVER,
    classify_api_request,
)


def test_classify_2xx_none():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/user/profile",
        status_code=200,
    )
    assert kind == ERROR_KIND_NONE
    assert expected is False


def test_classify_401_auth_refresh_expected():
    kind, expected = classify_api_request(
        _method="POST",
        route_pattern="/api/v1/auth/refresh-token",
        status_code=401,
    )
    assert kind == ERROR_KIND_AUTH
    assert expected is True


def test_classify_401_auth_login_expected_client_noise():
    """Login 401 (bad credentials) is client/auth noise, not a server incident."""
    kind, expected = classify_api_request(
        _method="POST",
        route_pattern="/api/v1/auth/login",
        status_code=401,
    )
    assert kind == ERROR_KIND_AUTH
    assert expected is True


def test_classify_403_research_task_status_expected():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/research/task-status/{task_id}",
        status_code=403,
    )
    assert kind == ERROR_KIND_FORBIDDEN
    assert expected is True


def test_classify_403_agent_route_expected():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/agent/clients",
        status_code=403,
    )
    assert kind == ERROR_KIND_FORBIDDEN
    assert expected is True


def test_classify_404_public_expected():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/public/agent-profile/{user_id}",
        status_code=404,
    )
    assert kind == ERROR_KIND_NOT_FOUND
    assert expected is True


def test_classify_404_private_not_expected():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/user/profile",
        status_code=404,
    )
    assert kind == ERROR_KIND_NOT_FOUND
    assert expected is False


def test_classify_429_rate_limited_expected():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/search/properties-by-polygon",
        status_code=429,
    )
    assert kind == ERROR_KIND_RATE_LIMITED
    assert expected is True


def test_classify_401_webhook_hmac_expected():
    kind, expected = classify_api_request(
        _method="POST",
        route_pattern="/api/v1/webhooks/docusign/connect",
        status_code=401,
    )
    assert kind == ERROR_KIND_AUTH
    assert expected is True


def test_classify_500_server():
    kind, expected = classify_api_request(
        _method="GET",
        route_pattern="/api/v1/user/profile",
        status_code=500,
    )
    assert kind == ERROR_KIND_SERVER
    assert expected is False
