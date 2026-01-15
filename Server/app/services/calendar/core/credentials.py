"""
Credential management for Google Calendar
Handles loading and refreshing Google OAuth credentials
"""

import threading
from datetime import datetime, timezone
from typing import Dict

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest

from app.utils.security.app_logging import get_logger
from app.services.auth.tokens import tokens_get, tokens_upsert, tokens_delete
from app.services.calendar.permissions import get_scopes_from_tokeninfo, update_token_permissions_from_scopes
from app.utils.security.security import log_oauth_event

logger = get_logger()

# Lock for preventing concurrent token refreshes per user
_refresh_locks: Dict[str, threading.Lock] = {}
_refresh_locks_lock = threading.Lock()  # Lock for managing refresh locks


def _get_refresh_lock(user_id: str) -> threading.Lock:
    """Get or create a lock for a specific user to prevent concurrent refreshes"""
    with _refresh_locks_lock:
        if user_id not in _refresh_locks:
            _refresh_locks[user_id] = threading.Lock()
        return _refresh_locks[user_id]


def load_credentials(
    user_id: str,
    client_id: str,
    client_secret: str,
    token_endpoint: str,
    scopes: list
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
    
    # Ensure all required fields are present, using service defaults as fallback
    # client_secret always comes from config (not stored in DB)
    refresh_token = token_data.get("refresh_token")
    token_uri = token_data.get("token_uri") or token_endpoint
    stored_client_id = token_data.get("client_id") or client_id
    stored_client_secret = client_secret  # Always use config value
    stored_scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else scopes
    
    # Validate that we have the minimum required fields
    if not token_data.get("access_token"):
        raise RuntimeError("Google Calendar not connected: missing access token")
    
    # Early validation: Check if refresh_token is missing (critical for token refresh)
    # This prevents 500 errors when Google tries to refresh expired tokens
    if not refresh_token:
        logger.warning(f"Missing refresh_token for user {user_id} - reconnection required")
        raise RuntimeError("GOOGLE_RECONNECT_REQUIRED: Missing refresh token. Please reconnect your Google Calendar account.")
    
    # Validate that all required credential fields are present
    if not all([token_uri, stored_client_id, stored_client_secret]):
        logger.warning(f"Missing required credential fields for user {user_id} - reconnection required")
        raise RuntimeError("GOOGLE_RECONNECT_REQUIRED: Missing required credential fields. Please reconnect your Google Calendar account.")
    
    creds = Credentials(
        token=token_data["access_token"],
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=stored_client_id,
        client_secret=stored_client_secret,
        scopes=stored_scopes,
    )
    
    # Refresh if expired or about to expire (within 5 minutes)
    # This proactive refresh helps prevent expiration errors
    expiry = token_data.get("expiry")
    if expiry:
        try:
            expiry_dt = expiry if isinstance(expiry, datetime) else datetime.fromisoformat(str(expiry).replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            # Refresh if expired or expiring within 5 minutes
            should_refresh = (expiry_dt - now).total_seconds() < 300
        except Exception:
            # If we can't parse expiry, check if creds.expired
            should_refresh = creds.expired
    else:
        should_refresh = creds.expired
    
    if should_refresh and creds.refresh_token:
        # Use per-user lock to prevent concurrent refreshes
        user_lock = _get_refresh_lock(user_id)
        
        with user_lock:
            # Re-check token data after acquiring lock (another thread may have refreshed it)
            token_data = tokens_get(user_id)
            if not token_data:
                raise RuntimeError("Google Calendar not connected")
            
            # Check if token was already refreshed by another thread
            expiry = token_data.get("expiry")
            if expiry:
                try:
                    expiry_dt = expiry if isinstance(expiry, datetime) else datetime.fromisoformat(str(expiry).replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    should_refresh = (expiry_dt - now).total_seconds() < 300
                except Exception:
                    should_refresh = creds.expired
            else:
                should_refresh = creds.expired
            
            # Only refresh if still needed
            if should_refresh:
                try:
                    # Ensure all required fields are present for refresh
                    refresh_token = token_data.get("refresh_token")
                    if not refresh_token:
                        raise RuntimeError("Google Calendar not connected: missing refresh token. Please reconnect.")
                    
                    token_uri = token_data.get("token_uri") or token_endpoint
                    stored_client_id = token_data.get("client_id") or client_id
                    stored_client_secret = client_secret  # Always use config value
                    stored_scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else scopes
                    
                    # Recreate creds with latest token data and validated fields
                    creds = Credentials(
                        token=token_data["access_token"],
                        refresh_token=refresh_token,
                        token_uri=token_uri,
                        client_id=stored_client_id,
                        client_secret=stored_client_secret,
                        scopes=stored_scopes,
                    )
                    
                    # Validate that all required fields are present before refresh
                    if not all([creds.refresh_token, creds.token_uri, creds.client_id, creds.client_secret]):
                        raise RuntimeError("Google Calendar not connected: missing required credential fields. Please reconnect.")
                    
                    creds.refresh(GoogleRequest())
                    
                    # CRITICAL: Preserve the refresh_token from stored data, not from creds
                    # The Google Credentials object may not preserve refresh_token after refresh
                    # Always use the refresh_token from token_data (which we validated exists above)
                    stored_refresh_token = token_data.get("refresh_token")
                    if not stored_refresh_token:
                        # Fallback to creds.refresh_token, but this should not happen
                        stored_refresh_token = creds.refresh_token
                        logger.warning(f"Using refresh_token from Credentials object for user {user_id} (unexpected)")
                    
                    # CRITICAL: Get authoritative scopes from tokeninfo endpoint
                    # This is the canonical source of truth - scopes are embedded in the access token
                    # Google does not provide an API to list all scopes - they're in the token itself
                    actual_scopes = get_scopes_from_tokeninfo(creds.token)
                    
                    if actual_scopes:
                        # Use scopes from tokeninfo (authoritative source)
                        logger.info(f"Using scopes from tokeninfo for user {user_id}: {actual_scopes}")
                        scopes_to_store = actual_scopes
                    else:
                        # Fallback to stored scopes if tokeninfo fails (shouldn't happen often)
                        logger.warning(f"Tokeninfo failed for user {user_id}, using stored scopes: {token_data.get('scopes', '')}")
                        scopes_to_store = token_data.get("scopes", "")
                    
                    # Update stored tokens - explicitly preserve refresh_token
                    # client_secret not stored - always use config value
                    updated_tokens = {
                        "access_token": creds.token,
                        "refresh_token": stored_refresh_token,  # Preserve from stored data, not creds
                        "token_uri": token_data["token_uri"],
                        "client_id": token_data["client_id"],
                        # client_secret removed - always use config value
                        "scopes": scopes_to_store,  # Use authoritative scopes from tokeninfo
                        "expiry": creds.expiry
                    }
                    tokens_upsert(user_id, updated_tokens)
                    logger.info(f"Tokens refreshed for user {user_id}, refresh_token preserved: {bool(stored_refresh_token)}")
                    log_oauth_event("tokens_refreshed", user_id)
                    
                except Exception as e:
                    error_str = str(e).lower()
                    # Check if this is a refresh token error (invalid_grant, invalid_token, etc.)
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
                            "client_secret"
                        ]
                    )
                    
                    if is_refresh_error:
                        # Refresh token is invalid/revoked or missing required fields - clear tokens and indicate reconnection needed
                        logger.warning(f"Refresh token invalid or missing required fields for user {user_id}, clearing tokens: {str(e)}")
                        tokens_delete(user_id)
                        log_oauth_event("tokens_cleared_after_refresh_failure", user_id, error=str(e))
                        raise RuntimeError("Google Calendar not connected. Please reconnect your Google Calendar account.")
                    else:
                        # Other errors (network, etc.) - log and re-raise
                        logger.error(f"Failed to refresh credentials for user {user_id}: {str(e)}", exc_info=True)
                        raise RuntimeError(f"Failed to refresh Google credentials: {str(e)}")
            else:
                # Token was refreshed by another thread, reload with fresh data
                refresh_token = token_data.get("refresh_token")
                token_uri = token_data.get("token_uri") or token_endpoint
                stored_client_id = token_data.get("client_id") or client_id
                stored_client_secret = client_secret  # Always use config value
                stored_scopes = token_data.get("scopes", "").split() if token_data.get("scopes") else scopes
                
                creds = Credentials(
                    token=token_data["access_token"],
                    refresh_token=refresh_token,
                    token_uri=token_uri,
                    client_id=stored_client_id,
                    client_secret=stored_client_secret,
                    scopes=stored_scopes,
                )
    
    return creds
