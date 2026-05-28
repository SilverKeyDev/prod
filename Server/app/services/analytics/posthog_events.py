"""Central PostHog product analytics helpers."""

from __future__ import annotations

from typing import Any

from flask import has_request_context, request

from app.posthog_client import get_posthog_client
from app.services.analytics.posthog_constants import (
    POSTHOG_DISTINCT_ID_HEADER,
    POSTHOG_SESSION_ID_HEADER,
)
from logger import LOG_CATEGORIES, log


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
            LOG_CATEGORIES["API"],
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
            LOG_CATEGORIES["API"],
            "posthog_set_person_failed",
            {"error_type": type(exc).__name__},
        )
