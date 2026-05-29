"""
Verify Google Calendar API push notification (webhook) requests.

Google sends channel metadata in headers when a watch subscription fires.
The channel token must match the secret configured when the watch was created.
"""

import os
import re

from app.config import Config
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

_ALLOWED_RESOURCE_STATES = frozenset({"sync", "exists", "not_exists"})
_CHANNEL_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
_RESOURCE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,256}$")


def _is_strict_webhook_env() -> bool:
    """Require configured secrets outside local development and pytest."""
    from app.utils.testing_mode import is_testing

    if is_testing():
        return False
    return os.getenv("FLASK_ENV", "development") != "development"


def verify_calendar_webhook(
    *,
    channel_token: str | None,
    channel_id: str | None,
    resource_id: str | None,
    resource_state: str | None,
) -> bool:
    """
    Verify an incoming Google Calendar push notification.

    Returns True when the request should be accepted.
    """
    if not resource_state or not resource_id:
        logger.warn(
            LOG_CATEGORIES["SECURITY"],
            "Calendar webhook missing required headers",
            {"has_resource_state": bool(resource_state), "has_resource_id": bool(resource_id)},
        )
        return False

    if resource_state not in _ALLOWED_RESOURCE_STATES:
        logger.security(
            LOG_CATEGORIES["SECURITY"],
            "Calendar webhook invalid resource state",
            {"resource_state": resource_state},
        )
        return False

    if not _RESOURCE_ID_RE.match(resource_id):
        logger.security(
            LOG_CATEGORIES["SECURITY"],
            "Calendar webhook invalid resource id format",
        )
        return False

    if channel_id and not _CHANNEL_ID_RE.match(channel_id):
        logger.security(
            LOG_CATEGORIES["SECURITY"],
            "Calendar webhook invalid channel id format",
        )
        return False

    expected_token = (getattr(Config, "GOOGLE_CALENDAR_WEBHOOK_TOKEN", None) or "").strip()
    if not expected_token:
        if _is_strict_webhook_env():
            logger.security(
                LOG_CATEGORIES["SECURITY"],
                "GOOGLE_CALENDAR_WEBHOOK_TOKEN not configured in non-development environment",
            )
            return False
        logger.warn(
            LOG_CATEGORIES["SECURITY"],
            "GOOGLE_CALENDAR_WEBHOOK_TOKEN not configured, skipping channel token check",
        )
        return True

    if not channel_token or not _constant_time_equal(channel_token, expected_token):
        logger.security(
            LOG_CATEGORIES["SECURITY"],
            "Calendar webhook channel token mismatch",
            {"has_token": bool(channel_token)},
        )
        return False

    return True


def _constant_time_equal(a: str, b: str) -> bool:
    import hmac

    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))
