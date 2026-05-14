"""
OAuth management for Google Calendar
Handles OAuth state, authorization URLs, and token exchange
"""

import base64
import time
import uuid
from urllib.parse import urlencode

from app import db
from app.models import OAuthState
from app.utils.security.app_logging import get_logger
from app.utils.security.security import log_oauth_event, redact_sensitive_data

logger = get_logger()

# Counter for periodic cleanup of expired OAuth states
_validation_count = 0


def _is_scope_included_in_oauth_request(scope_url: str) -> bool:
    from app.services.calendar.permissions.constants import permissions

    for perm_data in permissions.values():
        if perm_data["scope_url"] == scope_url:
            return perm_data.get("include_in_oauth_request", True)
    return False


def generate_state(user_id: str) -> str:
    """Generate CSRF state parameter"""
    timestamp = str(int(time.time()))
    random_data = str(uuid.uuid4())
    data = f"{user_id}:{timestamp}:{random_data}"
    return base64.urlsafe_b64encode(data.encode()).decode()


def validate_state(state: str, session_state: str | None = None) -> bool:
    """
    Validate OAuth state parameter from database.
    Falls back to session_state for backward compatibility, but DB is preferred.
    """
    global _validation_count

    if not state:
        return False

    # Periodic cleanup of expired/used states (every 10th validation)
    _validation_count += 1
    if _validation_count % 10 == 0:
        try:
            deleted = OAuthState.cleanup_expired(older_than_hours=1)
            if deleted > 0:
                logger.debug(f"Cleaned up {deleted} expired/used OAuth states")
        except Exception as e:
            logger.warning(f"Error during OAuth state cleanup: {str(e)}")

    # Try DB first (preferred method)
    try:
        state_record = OAuthState.query.filter_by(
            state=state, oauth_type="calendar", used=False
        ).first()
        if state_record:
            # Check if expired
            if state_record.is_expired():
                logger.warning(f"OAuth state expired: {state[:20]}...")
                return False
            # Mark as used
            state_record.used = True
            db.session.commit()
            return True
    except Exception as e:
        logger.warning(f"Error validating state from DB, falling back to session: {str(e)}")

    # Fallback to session-based validation (backward compatibility)
    if session_state:
        return state == session_state

    return False


def build_auth_url(
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    auth_endpoint: str,
    scopes: list,
    user_id: str,
    request_full_scope: bool = False,
    use_scheduling_scopes: bool = False,
    request_additional_scopes: list[str] | None = None,
) -> tuple[str, str]:
    """Build Google OAuth authorization URL with incremental authorization

    Requests scopes from permissions.constants where include_in_oauth_request is true
    (virtual full Calendar scope is never requested).
    The include_granted_scopes parameter ensures existing permissions are preserved.

    Args:
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret (not used in URL, but kept for consistency)
        redirect_uri: OAuth redirect URI
        auth_endpoint: OAuth authorization endpoint
        scopes: Default scopes list (deprecated - all scopes from constants are used)
        user_id: User ID
        request_full_scope: Deprecated - all scopes are always requested
        use_scheduling_scopes: Deprecated - all scopes are always requested
        request_additional_scopes: Optional list of additional scope URLs to ensure are included.
                                  All scopes from permissions constants are already requested.

    Returns:
        Tuple of (auth_url, state)
    """
    state = generate_state(user_id)

    # Store state in database for reliable validation (works even if cookies fail)
    try:
        state_record = OAuthState(state=state, oauth_type="calendar", user_id=user_id, used=False)
        db.session.add(state_record)
        db.session.commit()
        logger.debug(f"Stored OAuth state in DB for calendar flow: {state[:20]}...")
    except Exception as e:
        logger.warning(f"Failed to store OAuth state in DB for calendar flow: {str(e)}")
        # Continue anyway - will fall back to session if DB fails

    # Import permissions constants to ensure only allowed scopes are used
    from app.services.calendar.permissions.constants import (
        oauth_requested_scope_urls,
        permissions,
    )

    requested_scopes = list(oauth_requested_scope_urls())

    # If additional scopes are explicitly requested, ensure they're included (requestable only)
    if request_additional_scopes:
        valid_scopes = {perm_data["scope_url"] for perm_data in permissions.values()}
        for scope in request_additional_scopes:
            if scope not in valid_scopes:
                logger.warning(f"Filtered out invalid scope: {scope}")
                continue
            if not _is_scope_included_in_oauth_request(scope):
                logger.warning(f"Filtered out scope not allowed in OAuth request: {scope}")
                continue
            if scope not in requested_scopes:
                requested_scopes.append(scope)

    # Validate redirect_uri before building URL
    if not redirect_uri or not redirect_uri.strip():
        raise ValueError("Redirect URI is empty or missing in build_auth_url")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(requested_scopes),
        "access_type": "offline",
        "prompt": "consent",  # Force consent screen to ensure refresh_token is issued
        "include_granted_scopes": "true",  # Enable incremental authorization
        "state": state,
    }

    # Log redirect_uri for debugging (redacted for security)
    logger.info(
        "GOOGLE_AUTH_URL_GENERATED",
        extra={
            "user_id": user_id,
            "redirect_uri": redact_sensitive_data({"uri": redirect_uri}).get("uri", "[REDACTED]"),
            "requested_scopes": requested_scopes,
            "state": state[:20] + "..." if state else None,
        },
    )

    log_oauth_event(
        "auth_url_generated",
        user_id,
        params=redact_sensitive_data(params),
        requested_scopes=requested_scopes,
    )
    return f"{auth_endpoint}?{urlencode(params)}", state
