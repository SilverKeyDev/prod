"""
OAuth management for Google Calendar
Handles OAuth state, authorization URLs, and token exchange
"""

import time
import uuid
import base64
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get, tokens_upsert
from app.services.calendar.permissions import get_scopes_from_tokeninfo
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
    use_scheduling_scopes: bool = False,
    request_additional_scopes: Optional[List[str]] = None
) -> tuple[str, str]:
    """Build Google OAuth authorization URL with incremental authorization
    
    Always requests all scopes defined in app.services.calendar.permissions.constants.
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
    
    # Import permissions constants to ensure only allowed scopes are used
    from app.services.calendar.permissions.constants import permissions
    
    # Always request all scopes from permissions constants
    # include_granted_scopes will preserve existing permissions (incremental authorization)
    requested_scopes = [perm_data['scope_url'] for perm_data in permissions.values()]
    
    # If additional scopes are explicitly requested, ensure they're included
    # (though they should already be in the full list)
    if request_additional_scopes:
        valid_scopes = {perm_data['scope_url'] for perm_data in permissions.values()}
        for scope in request_additional_scopes:
            if scope in valid_scopes and scope not in requested_scopes:
                requested_scopes.append(scope)
            elif scope not in valid_scopes:
                logger.warning(f"Filtered out invalid scope: {scope}")
    
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
    logger.info(f"GOOGLE_AUTH_URL_GENERATED", extra={
        'user_id': user_id,
        'redirect_uri': redact_sensitive_data({'uri': redirect_uri}).get('uri', '[REDACTED]'),
        'requested_scopes': requested_scopes,
        'state': state[:20] + '...' if state else None
    })
    
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
        # Validate inputs before making request
        if not code or not code.strip():
            raise ValueError("Authorization code is empty or missing")
        
        if not redirect_uri or not redirect_uri.strip():
            raise ValueError("Redirect URI is empty or missing")
        
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
        
        # Log request details (redact sensitive data)
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_REQUEST", extra={
            'request_id': request_id,
            'user_id': user_id,
            'has_code': bool(code),
            'code_length': len(code) if code else 0,
            'redirect_uri': redact_sensitive_data({'uri': redirect_uri}).get('uri', '[REDACTED]'),
            'token_endpoint': token_endpoint,
            'has_client_id': bool(client_id),
            'has_client_secret': bool(client_secret)
        })
        
        response = session.post(token_endpoint, data=token_data)
        
        logger.info(f"GOOGLE_TOKEN_EXCHANGE_RESPONSE", extra={
            'request_id': request_id,
            'user_id': user_id,
            'status_code': response.status_code,
            'response_size': len(response.text),
            'content_type': response.headers.get('Content-Type', 'unknown')
        })
        
        if response.status_code != 200:
            # Try to parse error response for better error messages
            error_details = {}
            try:
                error_json = response.json()
                error_details = {
                    'error': error_json.get('error'),
                    'error_description': error_json.get('error_description', ''),
                    'error_uri': error_json.get('error_uri', '')
                }
            except (ValueError, KeyError):
                # If response is not JSON, use text
                error_details = {'raw_response': response.text[:500]}
            
            # Log detailed error information
            log_oauth_event("token_exchange_failed", user_id,
                          status_code=response.status_code,
                          error_code=error_details.get('error'),
                          error_description=error_details.get('error_description'),
                          response_text=response.text[:500])
            
            # Provide more specific error messages based on Google's error codes
            error_code = error_details.get('error', 'unknown')
            error_description = error_details.get('error_description', '')
            
            if error_code == 'invalid_grant':
                # This usually means the code was already used or expired
                error_msg = (
                    f"Authorization code is invalid, expired, or already used. "
                    f"Please restart the OAuth flow. "
                    f"Details: {error_description or 'Code may have expired or been used already'}"
                )
            elif error_code == 'invalid_client':
                error_msg = (
                    f"Invalid client credentials. "
                    f"Please check GOOGLE_CLIENT_ID and GOOGLE_CALENDAR_SECRET configuration. "
                    f"Details: {error_description or 'Client authentication failed'}"
                )
            elif error_code == 'redirect_uri_mismatch':
                error_msg = (
                    f"Redirect URI mismatch. "
                    f"The redirect_uri used in token exchange ({redirect_uri}) must exactly match "
                    f"the redirect_uri used in the authorization request. "
                    f"Details: {error_description or 'Redirect URI does not match'}"
                )
            elif error_code == 'internal_failure':
                error_msg = (
                    f"Google OAuth internal error. This may be temporary. "
                    f"Common causes: redirect_uri mismatch, code already used, or temporary Google service issue. "
                    f"Redirect URI used: {redirect_uri}. "
                    f"Details: {error_description or 'Google returned internal_failure'}"
                )
            else:
                error_msg = (
                    f"Token exchange failed with error '{error_code}'. "
                    f"Response: {response.text[:500]}"
                )
            
            logger.error(f"GOOGLE_TOKEN_EXCHANGE_FAILED", extra={
                'request_id': request_id,
                'user_id': user_id,
                'status_code': response.status_code,
                'error_code': error_code,
                'error_description': error_description,
                'redirect_uri': redact_sensitive_data({'uri': redirect_uri}).get('uri', '[REDACTED]')
            })
            
            raise RuntimeError(error_msg)
        
        tokens = response.json()
        
        # CRITICAL: Get authoritative scopes from tokeninfo endpoint
        # This is the canonical source of truth - scopes are embedded in the access token
        # Google does not provide an API to list all scopes - they're in the token itself
        access_token = tokens.get("access_token")
        actual_scopes = get_scopes_from_tokeninfo(access_token) if access_token else None
        
        if actual_scopes:
            # Use scopes from tokeninfo (authoritative source)
            granted_scopes = actual_scopes.split() if actual_scopes else []
            logger.info(f"Using scopes from tokeninfo for user {user_id}: {actual_scopes}")
        else:
            # Fallback to scopes from token response if tokeninfo fails
            granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
            # If no scopes in response, use the requested scopes
            if not granted_scopes:
                granted_scopes = scopes
            logger.warning(f"Tokeninfo failed for user {user_id}, using scopes from token response: {' '.join(granted_scopes)}")
        
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
        
        # Store tokens with actual granted scopes from tokeninfo (authoritative source)
        # Note: client_secret is not stored - always use config value
        token_data = {
            "access_token": tokens["access_token"],
            "refresh_token": new_refresh_token,  # Will be None if no existing token and Google didn't return one
            "token_uri": token_endpoint,
            "client_id": client_id,
            # client_secret removed - always use config value
            "scopes": actual_scopes if actual_scopes else " ".join(granted_scopes),  # Prefer tokeninfo scopes
            "expiry": datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
        }
        
        # Store tokens and update permissions from scopes
        if not tokens_upsert(user_id, token_data):
            raise RuntimeError(f"Failed to store tokens for user {user_id}")
        
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
