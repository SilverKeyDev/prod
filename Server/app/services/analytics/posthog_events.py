"""Central PostHog product analytics helpers."""

from __future__ import annotations

import os
import socket
import time
from typing import Any

from flask import Response, g, has_request_context, request

from app.posthog_client import get_posthog_client
from app.services.analytics.api_request_error_semantics import classify_api_request
from app.services.analytics.posthog_constants import (
    POSTHOG_DISTINCT_ID_HEADER,
    POSTHOG_SESSION_ID_HEADER,
)
from app.services.auth.user_role_helpers import user_role_names
from app.utils.http.route_pattern import normalize_flask_route_rule
from logger import log


def _resolve_distinct_id(fallback: str) -> str:
    if has_request_context():
        header_id = (request.headers.get(POSTHOG_DISTINCT_ID_HEADER) or "").strip()
        if header_id:
            return header_id
    return fallback


def _session_properties() -> dict[str, Any]:
    if not has_request_context():
        return {}
    session_id = (request.headers.get(POSTHOG_SESSION_ID_HEADER) or "").strip()
    if session_id:
        return {"$session_id": session_id}
    return {}


def capture_product_event(
    distinct_id: str,
    event: str,
    properties: dict[str, Any] | None = None,
) -> None:
    ph = get_posthog_client()
    if not ph:
        return

    merged: dict[str, Any] = {**(properties or {}), **_session_properties()}
    resolved_id = _resolve_distinct_id(str(distinct_id))
    try:
        ph.capture(
            distinct_id=resolved_id,
            event=event,
            properties=merged,
        )
    except Exception as exc:
        log.debug(
            "API",
            "posthog_capture_failed",
            {"event": event, "error_type": type(exc).__name__},
        )


def set_person_properties(distinct_id: str, properties: dict[str, Any]) -> None:
    ph = get_posthog_client()
    if not ph:
        return

    resolved_id = _resolve_distinct_id(str(distinct_id))
    try:
        ph.set(distinct_id=resolved_id, properties=properties)
    except Exception as exc:
        log.debug(
            "API",
            "posthog_set_person_failed",
            {"error_type": type(exc).__name__},
        )


def capture_backend_error(error: BaseException, *, status_code: int) -> None:
    """Capture a sanitized server error event for PostHog error tracking."""
    if status_code < 500:
        return

    route_pattern = None
    endpoint = None
    method = None
    path = None
    request_id = None
    if has_request_context():
        method = request.method
        path = request.path
        endpoint = request.endpoint
        request_id = getattr(g, "request_id", None)
        if request.url_rule is not None:
            route_pattern = normalize_flask_route_rule(request.url_rule.rule)

    properties: dict[str, Any] = {
        "status_code": status_code,
        "status_class": _status_class(status_code),
        "error_type": type(error).__name__,
        "request_id": request_id,
        "method": method,
        "path": path,
        "route_pattern": route_pattern,
        "endpoint_name": endpoint,
        "host": socket.gethostname(),
    }
    deploy_tag = (os.getenv("DEPLOY_IMAGE_TAG") or "").strip()
    if deploy_tag:
        properties["deploy_image_tag"] = deploy_tag

    capture_product_event(
        distinct_id=request_id or f"server:{socket.gethostname()}",
        event="backend_error",
        properties=properties,
    )


def _status_class(status_code: int) -> str:
    return f"{status_code // 100}xx"


def _header_distinct_id() -> str | None:
    if not has_request_context():
        return None
    header_id = (request.headers.get(POSTHOG_DISTINCT_ID_HEADER) or "").strip()
    return header_id or None


def _resolve_api_request_identity(
    gpc_opt_out: bool,
) -> tuple[str | None, str | None, str | None]:
    """Return (distinct_id, user_role, brokerage_org_id)."""
    if gpc_opt_out:
        return _header_distinct_id(), None, None

    distinct_id: str | None = None
    user_role: str | None = None
    brokerage_org_id: str | None = None

    try:
        from app.services.auth import get_current_user

        user = get_current_user()
        if user is not None:
            distinct_id = str(user.id)
            roles = user_role_names(user)
            if roles:
                user_role = roles[0]
            org_ids = getattr(user, "brokerage_org_ids", None)
            if isinstance(org_ids, list) and len(org_ids) == 1:
                brokerage_org_id = str(org_ids[0])
            return distinct_id, user_role, brokerage_org_id
    except Exception:
        pass

    distinct_id = _header_distinct_id()
    return distinct_id, user_role, brokerage_org_id


def _build_api_request_properties(
    response: Response,
) -> tuple[dict[str, Any], str | None, str | None] | None:
    if request.url_rule is None:
        return None

    route_pattern = normalize_flask_route_rule(request.url_rule.rule)
    status_code = int(response.status_code)
    start_perf = getattr(g, "_request_start_perf", None)
    duration_ms = (
        round((time.perf_counter() - start_perf) * 1000, 2) if start_perf is not None else None
    )

    gpc_opt_out = bool(getattr(g, "gpc_opt_out", False))
    _distinct_id, user_role, brokerage_org_id = _resolve_api_request_identity(gpc_opt_out)

    error_kind, expected_client_error = classify_api_request(
        _method=request.method,
        route_pattern=route_pattern,
        status_code=status_code,
    )

    properties: dict[str, Any] = {
        "endpoint": f"{request.method} {route_pattern}",
        "method": request.method,
        "route_pattern": route_pattern,
        "endpoint_name": request.endpoint,
        "status_code": status_code,
        "status_class": _status_class(status_code),
        "is_error": status_code >= 400,
        "is_server_error": status_code >= 500,
        "error_kind": error_kind,
        "expected_client_error": expected_client_error,
        "request_id": getattr(g, "request_id", None),
    }
    if duration_ms is not None:
        properties["duration_ms"] = duration_ms
        properties["latency_ms"] = duration_ms  # deprecated alias; use duration_ms
        properties["is_slow"] = duration_ms > 1000
    if user_role is not None:
        properties["user_role"] = user_role
    if brokerage_org_id is not None:
        properties["brokerage_org_id"] = brokerage_org_id

    deploy_tag = (os.getenv("DEPLOY_IMAGE_TAG") or "").strip()
    if deploy_tag:
        properties["deploy_image_tag"] = deploy_tag
    properties["host"] = socket.gethostname()
    web_concurrency = (os.getenv("WEB_CONCURRENCY") or "").strip()
    if web_concurrency:
        properties["gunicorn_workers"] = web_concurrency
    gunicorn_threads = (os.getenv("GUNICORN_THREADS") or "").strip()
    if gunicorn_threads:
        properties["gunicorn_threads"] = gunicorn_threads

    return properties, _distinct_id, brokerage_org_id


def capture_api_request(_request, response: Response) -> None:
    """Capture a structured ``api_request`` PostHog event for the current HTTP response."""
    try:
        ph = get_posthog_client()
        if not ph:
            return

        built = _build_api_request_properties(response)
        if built is None:
            return
        properties, distinct_id, brokerage_org_id = built

        merged: dict[str, Any] = {**properties, **_session_properties()}
        capture_kwargs: dict[str, Any] = {
            "event": "api_request",
            "properties": merged,
        }
        if distinct_id:
            capture_kwargs["distinct_id"] = distinct_id
        if brokerage_org_id:
            capture_kwargs["groups"] = {"brokerage": brokerage_org_id}

        ph.capture(**capture_kwargs)
    except Exception as exc:
        log.debug(
            "API",
            "posthog_api_request_failed",
            {"error_type": type(exc).__name__},
        )
