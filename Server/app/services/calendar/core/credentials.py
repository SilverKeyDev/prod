"""
Credential management for Google Calendar
Handles loading and refreshing Google OAuth credentials
"""

import threading
from datetime import datetime, timezone

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials

from app.services.auth.tokens import tokens_delete, tokens_get, tokens_upsert
from app.services.calendar.permissions import get_scopes_from_tokeninfo
from app.services.calendar.permissions.google_calendar_oauth import (
    normalize_google_oauth_scope_list,
    normalize_google_oauth_scope_string,
)
from app.utils.security.security import log_oauth_event
from logger import log

_refresh_locks: dict[str, threading.Lock] = {}
_refresh_locks_lock = threading.Lock()


def _get_refresh_lock(user_id: str) -> threading.Lock:
    """Get or create a lock for a specific user to prevent concurrent refreshes"""
    with _refresh_locks_lock:
        if user_id not in _refresh_locks:
            _refresh_locks[user_id] = threading.Lock()
        return _refresh_locks[user_id]


def load_credentials(
    user_id: str, client_id: str, client_secret: str, token_endpoint: str, scopes: list
) -> Credentials:
    """Load and refresh Google credentials for a user

    Uses per-user locking to prevent race conditions when multiple requests
    try to refresh the token simultaneously.

    Args:
        user_id: User ID
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list

    Returns:
        Google Credentials object

    Raises:
        RuntimeError: If tokens are missing or invalid, with message indicating reconnection needed
    """
    token_data = tokens_get(user_id)
    if not token_data:
        raise RuntimeError("Google Calendar not connected")
    refresh_token = token_data.get("refresh_token")
    token_uri = token_data.get("token_uri") or token_endpoint
    stored_client_id = token_data.get("client_id") or client_id
    stored_client_secret = client_secret
    stored_scopes = normalize_google_oauth_scope_list(
        token_data["scopes"].split() if token_data.get("scopes") else list(scopes)
    )
    if not token_data.get("access_token"):
        raise RuntimeError("Google Calendar not connected: missing access token")
    if not refresh_token:
        log.warn("CALENDAR", f"Missing refresh_token for user {user_id} - reconnection required")
        raise RuntimeError(
            "GOOGLE_RECONNECT_REQUIRED: Missing refresh token. Please reconnect your Google Calendar account."
        )
    if not all([token_uri, stored_client_id, stored_client_secret]):
        log.warn(
            "CALENDAR",
            f"Missing required credential fields for user {user_id} - reconnection required",
        )
        raise RuntimeError(
            "GOOGLE_RECONNECT_REQUIRED: Missing required credential fields. Please reconnect your Google Calendar account."
        )
    creds = Credentials(
        token=token_data["access_token"],
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=stored_client_id,
        client_secret=stored_client_secret,
        scopes=stored_scopes,
    )
    expiry = token_data.get("expiry")
    if expiry:
        try:
            expiry_dt = (
                expiry
                if isinstance(expiry, datetime)
                else datetime.fromisoformat(str(expiry).replace("Z", "+00:00"))
            )
            now = datetime.now(timezone.utc)
            should_refresh = (expiry_dt - now).total_seconds() < 300
        except Exception:
            should_refresh = creds.expired
    else:
        should_refresh = creds.expired
    if should_refresh and creds.refresh_token:
        user_lock = _get_refresh_lock(user_id)
        with user_lock:
            token_data = tokens_get(user_id)
            if not token_data:
                raise RuntimeError("Google Calendar not connected")
            expiry = token_data.get("expiry")
            if expiry:
                try:
                    expiry_dt = (
                        expiry
                        if isinstance(expiry, datetime)
                        else datetime.fromisoformat(str(expiry).replace("Z", "+00:00"))
                    )
                    now = datetime.now(timezone.utc)
                    should_refresh = (expiry_dt - now).total_seconds() < 300
                except Exception:
                    should_refresh = creds.expired
            else:
                should_refresh = creds.expired
            if should_refresh:
                try:
                    refresh_token = token_data.get("refresh_token")
                    if not refresh_token:
                        raise RuntimeError(
                            "Google Calendar not connected: missing refresh token. Please reconnect."
                        )
                    token_uri = token_data.get("token_uri") or token_endpoint
                    stored_client_id = token_data.get("client_id") or client_id
                    stored_client_secret = client_secret
                    stored_scopes = normalize_google_oauth_scope_list(
                        token_data["scopes"].split() if token_data.get("scopes") else list(scopes)
                    )
                    creds = Credentials(
                        token=token_data["access_token"],
                        refresh_token=refresh_token,
                        token_uri=token_uri,
                        client_id=stored_client_id,
                        client_secret=stored_client_secret,
                        scopes=stored_scopes,
                    )
                    if not all(
                        [creds.refresh_token, creds.token_uri, creds.client_id, creds.client_secret]
                    ):
                        raise RuntimeError(
                            "Google Calendar not connected: missing required credential fields. Please reconnect."
                        )
                    creds.refresh(GoogleRequest())
                    stored_refresh_token = token_data.get("refresh_token")
                    if not stored_refresh_token:
                        stored_refresh_token = creds.refresh_token
                        log.warn(
                            "CALENDAR",
                            f"Using refresh_token from Credentials object for user {user_id} (unexpected)",
                        )
                    actual_scopes = get_scopes_from_tokeninfo(creds.token)
                    if actual_scopes:
                        log.info(
                            "CALENDAR",
                            f"Using scopes from tokeninfo for user {user_id}: {actual_scopes}",
                        )
                        scopes_to_store = actual_scopes
                    else:
                        log.warn(
                            "CALENDAR",
                            f"Tokeninfo failed for user {user_id}, using stored scopes: {token_data.get('scopes', '')}",
                        )
                        scopes_to_store = normalize_google_oauth_scope_string(
                            token_data.get("scopes", "")
                        )
                    updated_tokens = {
                        "access_token": creds.token,
                        "refresh_token": stored_refresh_token,
                        "token_uri": token_data["token_uri"],
                        "client_id": token_data["client_id"],
                        "scopes": scopes_to_store,
                        "expiry": creds.expiry,
                    }
                    tokens_upsert(user_id, updated_tokens)
                    log.info(
                        "CALENDAR",
                        f"Tokens refreshed for user {user_id}, refresh_token preserved: {bool(stored_refresh_token)}",
                    )
                    log_oauth_event("tokens_refreshed", user_id)
                except Exception as e:
                    error_str = str(e).lower()
                    is_refresh_error = any(
                        keyword in error_str
                        for keyword in [
                            "invalid_grant",
                            "invalid_token",
                            "token has been revoked",
                            "invalid_request",
                            "refresh error",
                            "necessary fields",
                            "refresh_token",
                            "token_uri",
                            "client_id",
                            "client_secret",
                        ]
                    )
                    if is_refresh_error:
                        log.warn(
                            "CALENDAR",
                            f"Refresh token invalid or missing required fields for user {user_id}, clearing tokens: {str(e)}",
                        )
                        tokens_delete(user_id)
                        log_oauth_event(
                            "tokens_cleared_after_refresh_failure", user_id, error=str(e)
                        )
                        raise RuntimeError(
                            "Google Calendar not connected. Please reconnect your Google Calendar account."
                        ) from e
                    else:
                        log.error(
                            "ERRORS", f"Failed to refresh credentials for user {user_id}: {str(e)}"
                        )
                        raise RuntimeError(f"Failed to refresh Google credentials: {str(e)}") from e
            else:
                refresh_token = token_data.get("refresh_token")
                token_uri = token_data.get("token_uri") or token_endpoint
                stored_client_id = token_data.get("client_id") or client_id
                stored_client_secret = client_secret
                stored_scopes = normalize_google_oauth_scope_list(
                    token_data["scopes"].split() if token_data.get("scopes") else list(scopes)
                )
                creds = Credentials(
                    token=token_data["access_token"],
                    refresh_token=refresh_token,
                    token_uri=token_uri,
                    client_id=stored_client_id,
                    client_secret=stored_client_secret,
                    scopes=stored_scopes,
                )
    return creds
