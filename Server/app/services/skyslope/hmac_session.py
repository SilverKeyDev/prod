"""Cached SkySlope HMAC session (api.skyslope.com) with renewal before expiry."""

from __future__ import annotations

import threading
from datetime import datetime, timedelta, timezone

from app.config.skyslope import is_skyslope_hmac_configured
from app.services.skyslope.hmac_auth import perform_skyslope_hmac_login
from app.services.skyslope.hmac_signing import parse_skyslope_session_expiration

# Refresh if within this many seconds of API expiration (clock skew + latency).
_EXPIRY_BUFFER_SECONDS = 120
# Fallback session TTL if API omits Expiration (vendor notes ~2 hours).
_FALLBACK_SESSION_TTL = timedelta(hours=2)


class SkySlopeHmacSessionManager:
    """
    Thread-safe cache of the HMAC session token from /auth/login.

    SkySlope sessions expire (~2h). Call get_session() before REST calls; this
    manager re-authenticates when the cached token is near expiry.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._session: str | None = None
        self._expires_at: datetime | None = None

    def clear(self) -> None:
        with self._lock:
            self._session = None
            self._expires_at = None

    def _needs_refresh(self, *, force: bool) -> bool:
        if force:
            return True
        if not self._session:
            return True
        if not self._expires_at:
            return True
        now = datetime.now(timezone.utc)
        return now >= (self._expires_at - timedelta(seconds=_EXPIRY_BUFFER_SECONDS))

    def get_session(self, *, force_refresh: bool = False) -> str:
        if not is_skyslope_hmac_configured():
            raise ValueError("SkySlope HMAC is not configured")

        with self._lock:
            if not self._needs_refresh(force=force_refresh):
                assert self._session is not None
                return self._session

            data = perform_skyslope_hmac_login()
            self._session = data["session"]
            exp = parse_skyslope_session_expiration(data.get("expiration"))
            self._expires_at = exp or (datetime.now(timezone.utc) + _FALLBACK_SESSION_TTL)
            return self._session


_default_hmac_session_manager = SkySlopeHmacSessionManager()


def get_default_hmac_session_manager() -> SkySlopeHmacSessionManager:
    """Process-wide shared session cache for api.skyslope.com."""
    return _default_hmac_session_manager
