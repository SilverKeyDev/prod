"""Health, static assets, SPA catch-all, and request logging for the Flask app factory."""

from __future__ import annotations

import os
import random
import re
import time
from typing import TYPE_CHECKING

from flask import g, jsonify, make_response, request, send_from_directory
from sqlalchemy import text

from app.extensions import db

if TYPE_CHECKING:
    from flask import Flask

_CACHE_IMMUTABLE_WEB_ASSETS = "public, max-age=31536000, immutable"
_CACHE_SPA_INDEX = "no-cache, no-store, must-revalidate"
_CACHE_DIST_UNHASHED = "public, max-age=86400"


def register_flask_runtime_routes(
    app: Flask, static_dir: str, *, healthz_is_production: bool
) -> None:
    """Register health checks, Vite static files, SPA routing, and request logging."""

    @app.route("/assets/<path:filename>", methods=["GET", "HEAD"])
    def serve_assets(filename):
        out = make_response(send_from_directory(os.path.join(static_dir, "assets"), filename))
        out.headers["Cache-Control"] = _CACHE_IMMUTABLE_WEB_ASSETS
        return out

    @app.route("/robots.txt", methods=["GET", "HEAD"])
    @app.route("/manifest.webmanifest", methods=["GET", "HEAD"])
    @app.route("/site.webmanifest", methods=["GET", "HEAD"])
    @app.route("/favicon.ico", methods=["GET", "HEAD"])
    def top_level_static():
        p = request.path.lstrip("/")
        out = make_response(send_from_directory(static_dir, p))
        out.headers["Cache-Control"] = _CACHE_DIST_UNHASHED
        return out

    def _db_readiness_response():
        try:
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "ok", "database": "connected"}), 200
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}", exc_info=True)
            body = {"status": "error", "database": "disconnected"}
            if not healthz_is_production:
                body["error"] = str(e)
            return jsonify(body), 503

    @app.route("/healthz", methods=["GET", "HEAD"])
    def healthz():
        return _db_readiness_response()

    @app.route("/readyz", methods=["GET", "HEAD"])
    def readyz():
        return _db_readiness_response()

    @app.route("/livez", methods=["GET", "HEAD"])
    def livez():
        """Process liveness only (no DB). Use for Docker/orchestrator probes."""
        return jsonify({"status": "ok"}), 200

    @app.before_request
    def log_request_info():
        header_rid = request.headers.get("X-Request-ID") or request.headers.get("X-Request-Id")
        if (
            header_rid
            and isinstance(header_rid, str)
            and re.fullmatch(r"[A-Za-z0-9._-]{8,128}", header_rid)
        ):
            request_id = header_rid
        else:
            request_id = f"req_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        g.start_time = time.time()
        g.request_id = request_id
        g.gpc_opt_out = request.headers.get("Sec-GPC", "").strip() == "1"
        if request.endpoint and "auth" in request.endpoint:
            try:
                if request.is_json:
                    data = request.get_json()
                    if data:
                        sanitized_data = {}
                        for key, value in data.items():
                            if key == "email" and isinstance(value, str):
                                sanitized_data[key] = value[:3] + "***" + value[-3:]
                            elif key == "password":
                                sanitized_data[key] = f"[{len(str(value))} chars]"
                            else:
                                sanitized_data[key] = str(value)[:100]
            except Exception as e:
                app.logger.warning(
                    "AUTH_REQUEST_DATA_ERROR", extra={"request_id": request_id, "error": str(e)}
                )

    @app.route("/favicon.ico")
    def favicon():
        favicon_path = os.path.join(static_dir, "favicon.ico")
        if os.path.exists(favicon_path):
            out = make_response(send_from_directory(static_dir, "favicon.ico"))
            out.headers["Cache-Control"] = _CACHE_DIST_UNHASHED
            return out
        return ("", 204)

    @app.route("/", defaults={"path": ""}, methods=["GET", "HEAD"])
    @app.route("/<path:path>", methods=["GET", "HEAD"])
    def catch_all(path):
        if path.startswith(("api/", "static/")) or path in (
            "healthz",
            "livez",
            "readyz",
            "favicon.ico",
        ):
            return jsonify({"error": "Not Found"}), 404

        try:
            requested_file = os.path.join(static_dir, path)
            if os.path.commonpath([static_dir, requested_file]) == static_dir and os.path.isfile(
                requested_file
            ):
                out = make_response(send_from_directory(static_dir, path))
                base = os.path.basename(path) or path
                out.headers["Cache-Control"] = (
                    _CACHE_SPA_INDEX if base == "index.html" else _CACHE_DIST_UNHASHED
                )
                return out
        except (ValueError, OSError) as exc:
            app.logger.warning(
                "SPA catch_all static path resolution failed: %s",
                exc,
                exc_info=True,
            )

        out = make_response(send_from_directory(static_dir, "index.html"))
        out.headers["Cache-Control"] = _CACHE_SPA_INDEX
        return out
