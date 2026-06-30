"""SkySlope Transaction Management API HMAC auth and session tickets."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import requests

from app.services.skyslope.errors import SkySlopeAuthError, SkySlopeUpstreamError
from app.services.skyslope.http_config import (
    SKYSLOPE_API_BASE_URL,
    SKYSLOPE_AUTH_LOGIN_PATH,
    SKYSLOPE_REQUEST_TIMEOUT_SEC,
)

SESSION_TTL_SECONDS = 7200  # 2 hours


@dataclass(frozen=True)
class _CachedSession:
    ticket: str
    expires_at: float


_session_cache: dict[str, _CachedSession] = {}


def _require_partnership_credentials() -> tuple[str, str]:
    client_id = (os.getenv("SKYSLOPE_ACCESS_KEY") or "").strip()
    client_secret = (os.getenv("SKYSLOPE_SECRET") or "").strip()
    if not client_id or not client_secret:
        raise SkySlopeUpstreamError("Skyslope partnership credentials are not configured")
    return client_id, client_secret


def _rfc3339_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_hmac_signature(*, access_secret: str, timestamp: str) -> str:
    client_id, client_secret = _require_partnership_credentials()
    message = f"{client_id}:{client_secret}:{timestamp}".encode()
    digest = hmac.new(access_secret.encode("utf-8"), message, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


def build_auth_headers(*, access_key: str, access_secret: str) -> dict[str, str]:
    timestamp = _rfc3339_timestamp()
    signature = build_hmac_signature(access_secret=access_secret, timestamp=timestamp)
    return {
        "Timestamp": timestamp,
        "Authorization": f"SS {access_key}:{signature}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _extract_session_ticket(payload: dict) -> str | None:
    for key in ("session", "Session", "sessionId", "SessionId"):
        value = payload.get(key)
        if value:
            return str(value)
    return None


def login(*, access_key: str, access_secret: str) -> str:
    if not access_key.strip() or not access_secret.strip():
        raise SkySlopeAuthError("Brokerage AccessKey and AccessSecret are required")
    client_id, client_secret = _require_partnership_credentials()
    headers = build_auth_headers(access_key=access_key, access_secret=access_secret)
    url = f"{SKYSLOPE_API_BASE_URL}{SKYSLOPE_AUTH_LOGIN_PATH}"

    try:
        response = requests.post(
            url,
            headers=headers,
            json={"clientId": client_id, "clientSecret": client_secret},
            timeout=SKYSLOPE_REQUEST_TIMEOUT_SEC,
        )
    except requests.RequestException as exc:
        raise SkySlopeUpstreamError("Network error contacting SkySlope") from exc

    if response.status_code in (401, 403):
        raise SkySlopeAuthError(
            "SkySlope rejected brokerage credentials", status_code=response.status_code
        )
    if response.status_code >= 400:
        raise SkySlopeUpstreamError(
            f"SkySlope login failed ({response.status_code})",
            status_code=response.status_code,
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise SkySlopeUpstreamError("Invalid JSON from SkySlope login") from exc

    session = _extract_session_ticket(payload if isinstance(payload, dict) else {})
    if not session:
        raise SkySlopeUpstreamError("SkySlope login response missing session ticket")
    return session


def get_session_ticket(*, access_key: str, access_secret: str) -> str:
    cache_key = access_key.strip()
    now = time.time()
    cached = _session_cache.get(cache_key)
    if cached and cached.expires_at > now:
        return cached.ticket

    ticket = login(access_key=access_key, access_secret=access_secret)
    _session_cache[cache_key] = _CachedSession(
        ticket=ticket,
        expires_at=now + SESSION_TTL_SECONDS - 60,
    )
    return ticket


def clear_session_cache() -> None:
    """Test helper"""
    _session_cache.clear()
