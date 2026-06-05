"""GoogleOAuthToken ORM → internal credential dict (not exposed in OpenAPI)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.user.google_oauth_token import GoogleOAuthToken as GoogleOAuthTokenModel


class GoogleOAuthTokenDTO:
    @staticmethod
    def to_credentials(record: GoogleOAuthTokenModel) -> dict[str, Any]:
        """Shape expected by calendar token services (includes secrets)."""
        return {
            "access_token": record.access_token,
            "refresh_token": record.refresh_token,
            "token_uri": record.token_uri,
            "client_id": record.client_id,
            "scopes": record.scopes,
            "expiry": record.expiry,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
            "has_userinfo_email": record.has_userinfo_email,
            "has_userinfo_profile": record.has_userinfo_profile,
            "has_openid": record.has_openid,
            "has_calendar_freebusy": record.has_calendar_freebusy,
            "has_calendar_app_created": record.has_calendar_app_created,
        }
