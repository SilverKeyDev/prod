"""Classify api_request HTTP outcomes for PostHog SLOs vs expected client noise."""

from __future__ import annotations

ERROR_KIND_NONE = "none"
ERROR_KIND_SERVER = "server"
ERROR_KIND_AUTH = "auth"
ERROR_KIND_FORBIDDEN = "forbidden"
ERROR_KIND_NOT_FOUND = "not_found"
ERROR_KIND_RATE_LIMITED = "rate_limited"
ERROR_KIND_CLIENT = "client"

_AUTH_ROUTE_PREFIX = "/api/v1/auth/"
_AGENT_ROUTE_PREFIX = "/api/v1/agent/"
_ADMIN_ROUTE_PREFIX = "/api/v1/admin/"
_WEBHOOKS_ROUTE_PREFIX = "/api/v1/webhooks/"
_TASK_STATUS_SUFFIX = "/task-status/"


def _is_expected_client_error(*, error_kind: str, route_pattern: str, status_code: int) -> bool:
    if error_kind == ERROR_KIND_AUTH and status_code == 401:
        return route_pattern.startswith(_AUTH_ROUTE_PREFIX) or route_pattern.startswith(
            _WEBHOOKS_ROUTE_PREFIX
        )
    if error_kind == ERROR_KIND_FORBIDDEN and status_code == 403:
        return (
            route_pattern.startswith(_AGENT_ROUTE_PREFIX)
            or route_pattern.startswith(_ADMIN_ROUTE_PREFIX)
            or _TASK_STATUS_SUFFIX in route_pattern
        )
    if error_kind == ERROR_KIND_NOT_FOUND and status_code == 404:
        return route_pattern.startswith("/api/v1/public/")
    if error_kind == ERROR_KIND_RATE_LIMITED and status_code == 429:
        return True
    return False


def classify_api_request(
    *,
    _method: str,
    route_pattern: str,
    status_code: int,
) -> tuple[str, bool]:
    """
    Return (error_kind, expected_client_error) for an api_request event.

    error_kind drives incident SLOs; expected_client_error marks normal product flow
    (expired session, role gates, etc.) that should not page on is_error alone.
    """
    if status_code < 400:
        return ERROR_KIND_NONE, False
    if status_code >= 500:
        return ERROR_KIND_SERVER, False
    if status_code == 401:
        kind = ERROR_KIND_AUTH
    elif status_code == 403:
        kind = ERROR_KIND_FORBIDDEN
    elif status_code == 404:
        kind = ERROR_KIND_NOT_FOUND
    elif status_code == 429:
        kind = ERROR_KIND_RATE_LIMITED
    else:
        kind = ERROR_KIND_CLIENT

    expected = _is_expected_client_error(
        error_kind=kind,
        route_pattern=route_pattern,
        status_code=status_code,
    )
    return kind, expected
