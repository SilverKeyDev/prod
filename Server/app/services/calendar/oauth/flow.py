"""
OAuth management for Google Calendar
Handles OAuth state, authorization URLs, and token exchange
"""

import base64
import time
import uuid
from urllib.parse import urlencode

from sqlalchemy import select

from app import db
from app.models import OAuthState
from app.utils.security.security import log_oauth_event, redact_sensitive_data
from logger import log

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
    _validation_count += 1
    if _validation_count % 10 == 0:
        try:
            deleted = OAuthState.cleanup_expired(older_than_hours=1)
            if deleted > 0:
                log.debug("CALENDAR", f"Cleaned up {deleted} expired/used OAuth states")
        except Exception as e:
            log.warn("CALENDAR", f"Error during OAuth state cleanup: {str(e)}")
    try:
        state_record = db.session.scalar(
            select(OAuthState).where(
                OAuthState.state == state,
                OAuthState.oauth_type == "calendar",
                OAuthState.used.is_(False),
            )
        )
        if state_record:
            if state_record.is_expired():
                log.warn("CALENDAR", f"OAuth state expired: {state[:20]}...")
                return False
            state_record.used = True
            db.session.commit()
            return True
    except Exception as e:
        log.warn("CALENDAR", f"Error validating state from DB, falling back to session: {str(e)}")
    if session_state:
        return state == session_state
    return False


def validate_state_and_get_user_id(state: str) -> str | None:
    """
    Validate calendar OAuth state and return the user that started the flow.

    Calendar OAuth callbacks may arrive on a different origin (for example an
    ngrok callback URL), so they cannot rely on the browser sending normal app
    auth headers/cookies. The DB-backed OAuth state is the callback authority.
    """
    global _validation_count
    if not state:
        return None
    _validation_count += 1
    if _validation_count % 10 == 0:
        try:
            deleted = OAuthState.cleanup_expired(older_than_hours=1)
            if deleted > 0:
                log.debug("CALENDAR", f"Cleaned up {deleted} expired/used OAuth states")
        except Exception as e:
            log.warn("CALENDAR", f"Error during OAuth state cleanup: {str(e)}")
    try:
        state_record = db.session.scalar(
            select(OAuthState).where(
                OAuthState.state == state,
                OAuthState.oauth_type == "calendar",
                OAuthState.used.is_(False),
            )
        )
        if not state_record:
            return None
        if state_record.is_expired():
            log.warn("CALENDAR", f"OAuth state expired: {state[:20]}...")
            return None
        if not state_record.user_id:
            log.warn("CALENDAR", f"Calendar OAuth state missing user_id: {state[:20]}...")
            return None
        user_id = str(state_record.user_id)
        state_record.used = True
        db.session.commit()
        return user_id
    except Exception as e:
        db.session.rollback()
        log.warn("CALENDAR", f"Error validating calendar OAuth state from DB: {str(e)}")
        return None


def build_auth_url(
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    auth_endpoint: str,
    scopes: list,
    user_id: str,
    request_additional_scopes: list[str] | None = None,
) -> tuple[str, str]:
    """Build Google OAuth authorization URL.

    Requests scopes from permissions.constants where include_in_oauth_request is true
    (virtual full Calendar scope is never requested).

    Initial calendar connect requests only the current scope set. Incremental enhance
    (`request_additional_scopes`) sets include_granted_scopes so existing grants are kept.
    """
    state = generate_state(user_id)
    try:
        state_record = OAuthState(state=state, oauth_type="calendar", user_id=user_id, used=False)
        db.session.add(state_record)
        db.session.commit()
        log.debug("CALENDAR", f"Stored OAuth state in DB for calendar flow: {state[:20]}...")
    except Exception as e:
        log.warn("CALENDAR", f"Failed to store OAuth state in DB for calendar flow: {str(e)}")
    from app.services.calendar.permissions.constants import oauth_requested_scope_urls, permissions

    requested_scopes = list(oauth_requested_scope_urls())
    if request_additional_scopes:
        valid_scopes = {perm_data["scope_url"] for perm_data in permissions.values()}
        for scope in request_additional_scopes:
            if scope not in valid_scopes:
                log.warn("CALENDAR", f"Filtered out invalid scope: {scope}")
                continue
            if not _is_scope_included_in_oauth_request(scope):
                log.warn("CALENDAR", f"Filtered out scope not allowed in OAuth request: {scope}")
                continue
            if scope not in requested_scopes:
                requested_scopes.append(scope)
    if not redirect_uri or not redirect_uri.strip():
        raise ValueError("Redirect URI is empty or missing in build_auth_url")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(requested_scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    if request_additional_scopes:
        params["include_granted_scopes"] = "true"
    log.info(
        "CALENDAR",
        "GOOGLE_AUTH_URL_GENERATED",
        {
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
    return (f"{auth_endpoint}?{urlencode(params)}", state)
