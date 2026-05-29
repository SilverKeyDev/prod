"""PostHog API request telemetry — after_request hook and shared skip rules."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import request

from app.services.analytics.posthog_events import capture_api_request

if TYPE_CHECKING:
    from flask import Flask, Request, Response
    from werkzeug.routing import Rule


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


def register_api_telemetry(app: Flask) -> None:
    @app.after_request
    def _capture_api_telemetry(response: Response) -> Response:
        if not should_skip_api_telemetry(request, response):
            capture_api_request(request, response)
        return response
