"""HMAC authentication for SkySlope api.skyslope.com (listings, bulk export).

Use for server-to-server calls when no user OAuth flow is involved.
OAuth tokens from "Connect with SkySlope" are for the Forms/Partner API only.
See SkySlope Swagger and github.com/cybercoinc/skyslope-example-authentication.
"""

from __future__ import annotations

from datetime import datetime, timezone

import requests

from app.config.skyslope import get_skyslope_config, is_skyslope_hmac_configured
from app.services.skyslope.hmac_signing import build_hmac_login_request
from logger import LOG_CATEGORIES, log

DEFAULT_HMAC_LOGIN_URL = "https://api.skyslope.com/auth/login"


def _hmac_login(
    client_id: str,
    client_secret: str,
    access_key: str,
    access_secret: str,
    login_url: str = DEFAULT_HMAC_LOGIN_URL,
) -> dict:
    """
    POST to SkySlope auth/login with HMAC-SHA256. Returns session dict or raises.

    Returns:
        Dict with "session" and "expiration" keys (normalized from API casing).

    Raises:
        ValueError: If credentials are missing or login fails.
        requests.RequestException: On network errors.
    """
    if not all([client_id, client_secret, access_key, access_secret]):
        raise ValueError(
            "SkySlope HMAC: client_id, client_secret, access_key, access_secret required"
        )

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    headers, json_body = build_hmac_login_request(
        client_id,
        client_secret,
        access_key,
        access_secret,
        timestamp_utc=timestamp,
    )

    resp = requests.post(
        login_url,
        json=json_body,
        headers=headers,
        timeout=30,
    )

    if resp.status_code != 200:
        log.warn(
            LOG_CATEGORIES["API"],
            "SkySlope HMAC login failed",
            {"status": resp.status_code, "response": resp.text[:200]},
        )
        raise ValueError(f"SkySlope HMAC login failed: {resp.status_code} - {resp.text[:200]}")

    data = resp.json()
    session_token = data.get("Session") or data.get("session")
    if not session_token:
        raise ValueError("SkySlope HMAC login did not return a session token")

    return {
        "session": session_token,
        "expiration": data.get("Expiration") or data.get("expiration"),
    }


def perform_skyslope_hmac_login(login_url: str | None = None) -> dict:
    """
    Obtain a new session from SkySlope HMAC auth/login (always performs POST).

    Raises:
        ValueError: If HMAC is not configured or login fails.
    """
    if not is_skyslope_hmac_configured():
        raise ValueError("SkySlope HMAC is not configured")
    config = get_skyslope_config()
    url = login_url or config.get("hmac_login_url") or DEFAULT_HMAC_LOGIN_URL
    return _hmac_login(
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        access_key=config["hmac_access_key"],
        access_secret=config["hmac_access_secret"],
        login_url=url,
    )


def get_hmac_session_token(login_url: str | None = None) -> dict | None:
    """
    Get a session token for api.skyslope.com using HMAC credentials from config.

    Reads client id/secret plus optional SKYSLOPE_HMAC_ACCESS_KEY /
    SKYSLOPE_HMAC_ACCESS_SECRET from config (HMAC vars are not required for Partner OAuth).
    Use SkySlopeHmacSessionManager for
    cached sessions with renewal before the 2h expiry.

    Returns:
        Dict with "session" and "expiration" keys, or None if HMAC is not configured.
    """
    if not is_skyslope_hmac_configured():
        return None
    return perform_skyslope_hmac_login(login_url)
