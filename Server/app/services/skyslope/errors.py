"""SkySlope Transaction Management API error types."""

from __future__ import annotations


class SkySlopeError(Exception):
    """Base class for SkySlope client errors."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class SkySlopeAuthError(SkySlopeError):
    """401/403 - invalid AccessKey/Secret or expired session."""


class SkySlopeRateLimitError(SkySlopeError):
    """429 - rate limit exceeded (100 req/min per ClientID)."""


class SkySlopeUpstreamError(SkySlopeError):
    """5xx, network failure, or unexpected payload."""


def public_error_message(exc: SkySlopeError) -> str:
    """Safe message for admin UI - never include secrets or raw upstream bodies."""
    if isinstance(exc, SkySlopeAuthError):
        return "Invalid SkySlope credentials or unauthorized access."
    if isinstance(exc, SkySlopeRateLimitError):
        return "SkySlope rate limit reached. Try again in a few minutes."
    if isinstance(exc, SkySlopeUpstreamError):
        return "SkySlope is temporarily unavailable. Try again later."
    return "SkySlope request failed."
