"""HMAC authentication for SkySlope api.skyslope.com (listings, bulk export).

Use for server-to-server calls when no user OAuth flow is involved.
OAuth tokens from "Connect with SkySlope" are for the Forms/Partner API only.
See SkySlope Swagger and github.com/cybercoinc/skyslope-example-authentication.
"""

import base64
import hmac as hmac_lib
import hashlib
from datetime import datetime, timezone

import requests

from app.config.skyslope import get_skyslope_config, is_skyslope_hmac_configured
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

    Args:
        client_id: OAuth/client ID from SkySlope.
        client_secret: OAuth/client secret from SkySlope.
        access_key: Per-user Access Key from SkySlope account.
        access_secret: Per-user Access Secret from SkySlope account.
        login_url: Override for auth endpoint (default api.skyslope.com).

    Returns:
        Dict with "Session" and "Expiration" keys.

    Raises:
        ValueError: If credentials are missing or login fails.
        requests.RequestException: On network errors.
    """
    if not all([client_id, client_secret, access_key, access_secret]):
        raise ValueError("SkySlope HMAC: client_id, client_secret, access_key, access_secret required")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    message = f"{client_id}:{client_secret}:{timestamp}"
    signature = hmac_lib.new(
        access_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    hmac_b64 = base64.b64encode(signature).decode("ascii")
    auth_header = f"SS {access_key}:{hmac_b64}"

    resp = requests.post(
        login_url,
        json={"clientID": client_id, "clientSecret": client_secret},
        headers={
            "Content-Type": "application/json",
            "Authorization": auth_header,
            "Timestamp": timestamp,
        },
        timeout=30,
    )

    if resp.status_code != 200:
        log.warn(
            LOG_CATEGORIES["API"],
            "SkySlope HMAC login failed",
            {"status": resp.status_code, "response": resp.text[:200]},
        )
        raise ValueError(
            f"SkySlope HMAC login failed: {resp.status_code} - {resp.text[:200]}"
        )

    data = resp.json()
    session_token = data.get("Session") or data.get("session")
    if not session_token:
        raise ValueError("SkySlope HMAC login did not return a session token")

    return {
        "session": session_token,
        "expiration": data.get("Expiration") or data.get("expiration"),
    }


def get_hmac_session_token(login_url: str | None = None) -> dict | None:
    """
    Get a session token for api.skyslope.com using HMAC credentials from config.

    Reads SKYSLOPE_ACCESS_KEY, SKYSLOPE_SECRET, SKYSLOPE_HMAC_ACCESS_KEY,
    SKYSLOPE_HMAC_ACCESS_SECRET from config. Use the returned session token
    in the Authorization header for Swagger API calls (e.g. bulk export).

    Returns:
        Dict with "session" and "expiration" keys, or None if HMAC is not configured.
    """
    if not is_skyslope_hmac_configured():
        return None
    config = get_skyslope_config()
    url = login_url or DEFAULT_HMAC_LOGIN_URL
    return _hmac_login(
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        access_key=config["hmac_access_key"],
        access_secret=config["hmac_access_secret"],
        login_url=url,
    )
