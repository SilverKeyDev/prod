"""Pure HMAC signing helpers for SkySlope api.skyslope.com (no Flask / app imports)."""

from __future__ import annotations

import base64
import hashlib
import hmac as hmac_lib
from datetime import datetime, timezone


def build_hmac_login_request(
    client_id: str,
    client_secret: str,
    access_key: str,
    access_secret: str,
    *,
    timestamp_utc: str,
) -> tuple[dict[str, str], dict[str, str]]:
    """
    Build headers and JSON body for POST .../auth/login (HMAC-SHA256).

    Message: clientId:clientSecret:timestamp (UTF-8). Key: access_secret (UTF-8).
    """
    message = f"{client_id}:{client_secret}:{timestamp_utc}"
    signature = hmac_lib.new(
        access_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    hmac_b64 = base64.b64encode(signature).decode("ascii")
    auth_header = f"SS {access_key}:{hmac_b64}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": auth_header,
        "Timestamp": timestamp_utc,
    }
    body = {"clientID": client_id, "clientSecret": client_secret}
    return headers, body


def parse_skyslope_session_expiration(expiration_raw: str | None) -> datetime | None:
    """Parse API Expiration string (e.g. 2019-07-11T20:34:50Z) to UTC datetime."""
    if not expiration_raw or not isinstance(expiration_raw, str):
        return None
    text = expiration_raw.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
