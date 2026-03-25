"""SkySlope OAuth token storage and refresh.

Refresh uses the standard OAuth2 token endpoint (form body), not HMAC.
"""

from datetime import datetime, timedelta, timezone

import requests

from app import db
from app.config.skyslope import get_skyslope_config, is_skyslope_configured
from app.models.user.user_integration import UserIntegration
from logger import LOG_CATEGORIES, log

PROVIDER_SKYSLOPE = "skyslope"


def get_tokens(user_id: str) -> dict | None:
    """
    Get stored SkySlope tokens for a user.

    Returns:
        Dict with access_token, refresh_token, expires_at, or None if not connected.
    """
    if not user_id:
        return None
    integration = UserIntegration.query.filter_by(
        user_id=user_id, provider=PROVIDER_SKYSLOPE
    ).first()
    if not integration:
        return None
    return {
        "access_token": integration.access_token,
        "refresh_token": integration.refresh_token,
        "expires_at": integration.expires_at,
    }


def save_tokens(
    user_id: str,
    access_token: str,
    refresh_token: str | None,
    expires_at: datetime | None,
) -> None:
    """Save or update SkySlope tokens for a user."""
    if not user_id:
        return
    integration = UserIntegration.query.filter_by(
        user_id=user_id, provider=PROVIDER_SKYSLOPE
    ).first()
    if integration:
        integration.access_token = access_token
        integration.refresh_token = refresh_token or integration.refresh_token
        integration.expires_at = expires_at
    else:
        integration = UserIntegration(
            user_id=user_id,
            provider=PROVIDER_SKYSLOPE,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
        db.session.add(integration)
    db.session.commit()


def clear_tokens(user_id: str) -> None:
    """Remove stored SkySlope tokens for a user."""
    UserIntegration.query.filter_by(user_id=user_id, provider=PROVIDER_SKYSLOPE).delete()
    db.session.commit()


def _is_token_expired(expires_at: datetime | None, buffer_seconds: int = 60) -> bool:
    """Check if token is expired or will expire within buffer_seconds."""
    if not expires_at:
        return True
    now = datetime.now(timezone.utc)
    return now >= (expires_at - timedelta(seconds=buffer_seconds))


def refresh_if_needed(user_id: str) -> dict:
    """
    Refresh SkySlope access token if expired. Returns fresh tokens.

    Raises:
        ValueError: If not configured, not connected, or refresh fails.
    """
    if not is_skyslope_configured():
        raise ValueError("SkySlope is not configured")

    tokens = get_tokens(user_id)
    if not tokens:
        raise ValueError("SkySlope not connected")

    if not _is_token_expired(tokens.get("expires_at")):
        return tokens

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        clear_tokens(user_id)
        raise ValueError("Refresh token missing; please reconnect SkySlope")

    config = get_skyslope_config()
    resp = requests.post(
        config["token_url"],
        data={
            "grant_type": "refresh_token",
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "refresh_token": refresh_token,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )

    if resp.status_code != 200:
        log.warn(
            LOG_CATEGORIES["API"],
            "SkySlope token refresh failed",
            {"status": resp.status_code, "user_id": user_id},
        )
        clear_tokens(user_id)
        raise ValueError("Token refresh failed; please reconnect SkySlope")

    data = resp.json()
    new_access = data.get("access_token")
    new_refresh = data.get("refresh_token") or refresh_token
    expires_in = data.get("expires_in", 3600)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    if not new_access:
        raise ValueError("SkySlope did not return access token")

    save_tokens(user_id, new_access, new_refresh, expires_at)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "expires_at": expires_at,
    }
