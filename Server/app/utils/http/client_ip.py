"""Resolve the client IP for rate limiting and audit logs (proxy-aware when enabled)."""

from __future__ import annotations

from flask import request


def get_client_ip() -> str:
    """Return the best-effort client IP for the current request."""
    forwarded = (request.headers.get("X-Forwarded-For") or "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = (request.headers.get("X-Real-IP") or "").strip()
    if real_ip:
        return real_ip
    return request.remote_addr or "unknown"
