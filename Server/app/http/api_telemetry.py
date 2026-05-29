"""PostHog API request telemetry — after_request hook and shared skip rules."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import g, request

from app.services.analytics.posthog_events import capture_api_request

if TYPE_CHECKING:
    from flask import Flask, Request, Response
    from werkzeug.routing import Rule

# Intentionally excluded from api_request telemetry (not in endpoints.json inventory).
SKIP_PATH_PREFIXES = ("/healthz", "/readyz", "/livez", "/static/", "/assets/")
SPA_CATCH_ALL_ENDPOINT = "catch_all"
_INVENTORY_EXCLUDED_METHODS = frozenset({"HEAD", "OPTIONS"})


def _path_matches_skip_prefix(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in SKIP_PATH_PREFIXES)


def should_skip_api_telemetry(request: Request, response: Response) -> bool:
    if request.endpoint is None:
        return True
    if request.method == "OPTIONS":
        return True
    if _path_matches_skip_prefix(request.path):
        return True
    if request.endpoint == SPA_CATCH_ALL_ENDPOINT:
        return True
    if response.mimetype == "text/event-stream":
        return True
    return False


def should_skip_route_for_inventory(rule: Rule, endpoint: str | None) -> bool:
    if endpoint is None:
        return True
    if endpoint == SPA_CATCH_ALL_ENDPOINT:
        return True
    if _path_matches_skip_prefix(rule.rule):
        return True
    methods = rule.methods or set()
    if methods.issubset(_INVENTORY_EXCLUDED_METHODS):
        return True
    return False


def _response_for_teardown_exception(exc: BaseException, app: Flask) -> Response:
    from werkzeug.exceptions import HTTPException

    if isinstance(exc, HTTPException):
        return app.make_response(exc.get_response())
    return app.response_class(status=500)


def _maybe_capture_api_telemetry(response: Response) -> Response:
    if getattr(g, "_api_telemetry_captured", False):
        return response
    if not should_skip_api_telemetry(request, response):
        capture_api_request(request, response)
        g._api_telemetry_captured = True
    return response


def register_api_telemetry(app: Flask) -> None:
    @app.after_request
    def _capture_api_telemetry_after(response: Response) -> Response:
        return _maybe_capture_api_telemetry(response)

    @app.teardown_request
    def _capture_api_telemetry_teardown(exc: BaseException | None) -> None:
        if exc is None:
            return
        if getattr(g, "_api_telemetry_captured", False):
            return
        if request.endpoint is None or request.url_rule is None:
            return
        response = _response_for_teardown_exception(exc, app)
        if should_skip_api_telemetry(request, response):
            return
        capture_api_request(request, response)
        g._api_telemetry_captured = True
