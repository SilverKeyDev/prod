"""PostHog Logs export via OpenTelemetry OTLP (always-on when POSTHOG_PROJECT_TOKEN is set)."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

POSTHOG_API_HOST = "https://us.i.posthog.com"
POSTHOG_LOGS_ENDPOINT = f"{POSTHOG_API_HOST}/i/v1/logs"
POSTHOG_DISTINCT_ID_HEADER = "X-POSTHOG-DISTINCT-ID"
POSTHOG_SESSION_ID_HEADER = "X-POSTHOG-SESSION-ID"

_initialized = False
_otel_logger: Any | None = None

_SEVERITY_MAP: dict[str, tuple[int, str]] = {
    "DEBUG": (5, "debug"),
    "INFO": (9, "info"),
    "WARN": (13, "warn"),
    "SECURITY": (13, "warn"),
    "ERROR": (17, "error"),
}


def is_posthog_otlp_initialized() -> bool:
    return _initialized


def _request_context_attributes() -> dict[str, str]:
    try:
        from flask import has_request_context, request

        if not has_request_context():
            return {}
        attrs: dict[str, str] = {}
        distinct_id = (request.headers.get(POSTHOG_DISTINCT_ID_HEADER) or "").strip()
        session_id = (request.headers.get(POSTHOG_SESSION_ID_HEADER) or "").strip()
        if distinct_id:
            attrs["posthogDistinctId"] = distinct_id
        if session_id:
            attrs["sessionId"] = session_id
        return attrs
    except Exception:
        return {}


def init_posthog_otlp(service_name: str) -> bool:
    """Initialize OTLP log export to PostHog. Idempotent; returns True when active."""
    global _initialized, _otel_logger

    if _initialized:
        return _otel_logger is not None

    api_key = (os.environ.get("POSTHOG_PROJECT_TOKEN") or "").strip()
    if not api_key:
        return False

    try:
        from app.utils.testing_mode import is_testing

        if is_testing():
            return False
    except Exception:
        pass

    try:
        from opentelemetry._logs import get_logger, set_logger_provider
        from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
        from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
        from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
        from opentelemetry.sdk.resources import Resource

        resource = Resource.create({"service.name": service_name})
        logger_provider = LoggerProvider(resource=resource)
        set_logger_provider(logger_provider)

        exporter = OTLPLogExporter(
            endpoint=POSTHOG_LOGS_ENDPOINT,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        logger_provider.add_log_record_processor(BatchLogRecordProcessor(exporter))

        root_logger = logging.getLogger()
        root_logger.setLevel(logging.DEBUG)
        otlp_handler = LoggingHandler(level=logging.DEBUG, logger_provider=logger_provider)
        root_logger.addHandler(otlp_handler)

        _otel_logger = get_logger("silverkey-logger")
        _initialized = True
        return True
    except Exception:
        logging.getLogger(__name__).exception("Failed to initialize PostHog OTLP logging")
        return False


def emit_structured_log(
    level: str,
    category: str,
    message: str,
    data: Any | None = None,
) -> None:
    """Emit a structured log record to PostHog (no category/level gating)."""
    if not _initialized or _otel_logger is None:
        return

    try:
        from opentelemetry._logs import LogRecord

        severity_number, severity_text = _SEVERITY_MAP.get(level.upper(), (9, "info"))
        attributes: dict[str, Any] = {
            "log.category": category,
            "log.source": "silverkey-logger",
            **_request_context_attributes(),
        }
        if data is not None:
            if isinstance(data, dict):
                attributes["log.data"] = json.dumps(data, default=str)
            else:
                attributes["log.data"] = str(data)

        _otel_logger.emit(
            LogRecord(
                severity_number=severity_number,
                severity_text=severity_text,
                body=message,
                attributes=attributes,
            )
        )
    except Exception:
        logging.getLogger(__name__).debug("PostHog structured log emit failed", exc_info=True)
