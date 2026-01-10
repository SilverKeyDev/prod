"""
OAuth management for Google Calendar
Handles OAuth state, authorization URLs, and token exchange
"""

import time
import uuid
import base64
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get, tokens_upsert
from app.models import OAuthState
from app import db
from app.utils.security.security import (
    redact_sensitive_data,
    sanitize_error_message,
    log_oauth_event,
)

logger = get_logger()

# Counter for periodic cleanup of expired OAuth states
_validation_count = 0


def generate_state(user_id: str) -> str:
    """Generate CSRF state parameter"""
    timestamp = str(int(time.time()))
    random_data = str(uuid.uuid4())
    data = f"{user_id}:{timestamp}:{random_data}"
    return base64.urlsafe_b64encode(data.encode()).decode()


def validate_state(state: str, session_state: Optional[str] = None) -> bool:
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
        state_record = OAuthState.query.filter_by(state=state, oauth_type='calendar', used=False).first()
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
    use_scheduling_scopes: bool = False
) -> tuple[str, str]:
    """Build Google OAuth authorization URL with incremental authorization
    
    Args:
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret (not used in URL, but kept for consistency)
        redirect_uri: OAuth redirect URI
        auth_endpoint: OAuth authorization endpoint
        scopes: Default scopes list
        user_id: User ID
        request_full_scope: If True, request calendar.app.created scope for creating/updating events.
                          Non-sensitive, no OAuth verification required.
        use_scheduling_scopes: If True, request calendar.app.created and calendar.freebusy scopes.
                             Note: calendar.freebusy is sensitive and requires verification.
    
    Returns:
        Tuple of (auth_url, state)
    """
    state = generate_state(user_id)
    
    # Store state in database for reliable validation (works even if cookies fail)
    try:
        state_record = OAuthState(
            state=state,
            oauth_type='calendar',
            user_id=user_id,
            used=False
        )
        db.session.add(state_record)
        db.session.commit()
        logger.debug(f"Stored OAuth state in DB for calendar flow: {state[:20]}...")
    except Exception as e:
        logger.warning(f"Failed to store OAuth state in DB for calendar flow: {str(e)}")
        # Continue anyway - will fall back to session if DB fails
    
    # Default to calendar.app.created (non-sensitive, no verification required)
    # This allows managing only calendars/events created by the app
    if request_full_scope:
        # Use calendar.app.created for creating and updating events (non-sensitive, no verification required)
        requested_scopes = ["https://www.googleapis.com/auth/calendar.app.created"]
    elif use_scheduling_scopes:
        # Note: calendar.freebusy requires OAuth verification
        requested_scopes = [
            "https://www.googleapis.com/auth/calendar.app.created",
            "https://www.googleapis.com/auth/calendar.freebusy"
        ]
    else:
        # Default: calendar.app.created (non-sensitive, no verification required)
        requested_scopes = ["https://www.googleapis.com/auth/calendar.app.created"]
    
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
    
    log_oauth_event("auth_url_generated", user_id,
                   params=redact_sensitive_data(params),
                   requested_scopes=requested_scopes)
    return f"{auth_endpoint}?{urlencode(params)}", state


def exchange_code_for_tokens(
    code: str,
    user_id: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    token_endpoint: str,
    scopes: list,
    session
) -> Dict[str, Any]:
    """Exchange authorization code for access tokens
    
    Args:
        code: Authorization code from OAuth callback
        user_id: User ID
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        redirect_uri: OAuth redirect URI
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        session: Requests session for making HTTP calls
    
    Returns:
        Dictionary containing token response from Google
    """
    request_id = str(uuid.uuid4())[:8]
    
    logger.info(f"GOOGLE_TOKEN_EXCHANGE_START", extra={
        'request_id': request_id,
        'user_id': user_id,
        'has_code': bool(code),
        'code_length': len(code) if code else 0
    })
    
    try:
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
        
        response = session.post(token_endpoint, data=token_data)
        
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_RESPONSE", extra={
            'request_id': request_id,
            'user_id': user_id,
            'status_code': response.status_code,
            'response_size': len(response.text)
        })
        
        if response.status_code != 200:
            log_oauth_event("token_exchange_failed", user_id,
                          status_code=response.status_code,
                          response_text=response.text[:200])
            raise RuntimeError(f"Token exchange failed: {response.text}")
        
        tokens = response.json()
        
        # Get granted scopes from token response (may include previously granted scopes)
        granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
        # If no scopes in response, use the requested scopes
        if not granted_scopes:
            granted_scopes = scopes
        
        # Get existing tokens to preserve refresh_token if Google doesn't return one
        existing_tokens = tokens_get(user_id)
        existing_refresh_token = existing_tokens.get("refresh_token") if existing_tokens else None
        
        # Google may not return refresh_token on subsequent consents
        # Preserve existing refresh_token if new one is not provided (handle None and empty string)
        new_refresh_token = tokens.get("refresh_token")
        # Treat empty string as missing (Google shouldn't return this, but be defensive)
        if not new_refresh_token or (isinstance(new_refresh_token, str) and not new_refresh_token.strip()):
            if existing_refresh_token:
                logger.info(f"Google did not return refresh_token, preserving existing one for user {user_id}")
                new_refresh_token = existing_refresh_token
            else:
                logger.warning(f"Google did not return refresh_token and no existing refresh_token found for user {user_id}")
                new_refresh_token = None
        else:
            logger.info(f"Google returned new refresh_token for user {user_id}")
        
        # Store tokens with actual granted scopes
        # Note: client_secret is not stored - always use config value
        token_data = {
            "access_token": tokens["access_token"],
            "refresh_token": new_refresh_token,  # Will be None if no existing token and Google didn't return one
            "token_uri": token_endpoint,
            "client_id": client_id,
            # client_secret removed - always use config value
            "scopes": " ".join(granted_scopes),
            "expiry": datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
        }
        
        tokens_upsert(user_id, token_data)
        
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_SUCCESS", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_refresh_token': bool(new_refresh_token),
            'google_returned_refresh_token': bool(tokens.get("refresh_token")),
            'preserved_existing_refresh_token': bool(existing_refresh_token and not tokens.get("refresh_token")),
            'expires_in': tokens.get("expires_in"),
            'granted_scopes': granted_scopes
        })
        
        log_oauth_event("tokens_stored", user_id, granted_scopes=granted_scopes)
        return tokens
        
    except Exception as e:
        error_msg = sanitize_error_message(e)
        logger.error(f"GOOGLE_TOKEN_EXCHANGE_ERROR", extra={
            'request_id': request_id,
            'user_id': user_id,
            'error': error_msg
        }, exc_info=True)
        log_oauth_event("token_exchange_error", user_id, error=error_msg)
        raise
