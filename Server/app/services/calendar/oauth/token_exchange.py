"""
Google Calendar OAuth token exchange (authorization code for tokens).
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.services.auth.tokens import tokens_get, tokens_upsert
from app.services.calendar.permissions import get_scopes_from_tokeninfo
from app.services.calendar.permissions.google_calendar_oauth import (
    normalize_google_oauth_scope_list,
)
from app.utils.security.security import (
    log_oauth_event,
    redact_sensitive_data,
    sanitize_error_message,
)
from logger import log


def exchange_code_for_tokens(
    code: str,
    user_id: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    token_endpoint: str,
    scopes: list,
    session,
) -> dict[str, Any]:
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
    log.info(
        "CALENDAR",
        "GOOGLE_TOKEN_EXCHANGE_START",
        {
            "request_id": request_id,
            "user_id": user_id,
            "has_code": bool(code),
            "code_length": len(code) if code else 0,
        },
    )
    try:
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
        log.info(
            "CALENDAR",
            "GOOGLE_TOKEN_EXCHANGE_REQUEST",
            {
                "request_id": request_id,
                "user_id": user_id,
                "has_code": bool(code),
                "code_length": len(code) if code else 0,
                "redirect_uri": redact_sensitive_data({"uri": redirect_uri}).get(
                    "uri", "[REDACTED]"
                ),
                "token_endpoint": token_endpoint,
                "has_client_id": bool(client_id),
                "has_client_secret": bool(client_secret),
            },
        )
        response = session.post(token_endpoint, data=token_data)
        log.info(
            "CALENDAR",
            "GOOGLE_TOKEN_EXCHANGE_RESPONSE",
            {
                "request_id": request_id,
                "user_id": user_id,
                "status_code": response.status_code,
                "response_size": len(response.text),
                "content_type": response.headers.get("Content-Type", "unknown"),
            },
        )
        if response.status_code != 200:
            error_details = {}
            try:
                error_json = response.json()
                error_details = {
                    "error": error_json.get("error"),
                    "error_description": error_json.get("error_description", ""),
                    "error_uri": error_json.get("error_uri", ""),
                }
            except (ValueError, KeyError):
                error_details = {"raw_response": response.text[:500]}
            log_oauth_event(
                "token_exchange_failed",
                user_id,
                status_code=response.status_code,
                error_code=error_details.get("error"),
                error_description=error_details.get("error_description"),
                response_text=response.text[:500],
            )
            error_code = error_details.get("error", "unknown")
            error_description = error_details.get("error_description", "")
            if error_code == "invalid_grant":
                error_msg = f"Authorization code is invalid, expired, or already used. Please restart the OAuth flow. Details: {error_description or 'Code may have expired or been used already'}"
            elif error_code == "invalid_client":
                error_msg = f"Invalid client credentials. Please check GOOGLE_CLIENT_ID and GOOGLE_CALENDAR_SECRET configuration. Details: {error_description or 'Client authentication failed'}"
            elif error_code == "redirect_uri_mismatch":
                error_msg = f"Redirect URI mismatch. The redirect_uri used in token exchange ({redirect_uri}) must exactly match the redirect_uri used in the authorization request. Details: {error_description or 'Redirect URI does not match'}"
            elif error_code == "internal_failure":
                error_msg = f"Google OAuth internal error. This may be temporary. Common causes: redirect_uri mismatch, code already used, or temporary Google service issue. Redirect URI used: {redirect_uri}. Details: {error_description or 'Google returned internal_failure'}"
            else:
                error_msg = f"Token exchange failed with error '{error_code}'. Response: {response.text[:500]}"
            log.error(
                "ERRORS",
                "GOOGLE_TOKEN_EXCHANGE_FAILED",
                {
                    "request_id": request_id,
                    "user_id": user_id,
                    "status_code": response.status_code,
                    "error_code": error_code,
                    "error_description": error_description,
                    "redirect_uri": redact_sensitive_data({"uri": redirect_uri}).get(
                        "uri", "[REDACTED]"
                    ),
                },
            )
            raise RuntimeError(error_msg)
        tokens = response.json()
        access_token = tokens.get("access_token")
        actual_scopes = get_scopes_from_tokeninfo(access_token) if access_token else None
        if actual_scopes:
            granted_scopes = actual_scopes.split() if actual_scopes else []
            log.info("CALENDAR", f"Using scopes from tokeninfo for user {user_id}: {actual_scopes}")
        else:
            granted_scopes = tokens.get("scope", "").split() if tokens.get("scope") else []
            if not granted_scopes:
                granted_scopes = scopes
            log.warn(
                "CALENDAR",
                f"Tokeninfo failed for user {user_id}, using scopes from token response: {' '.join(granted_scopes)}",
            )
        granted_scopes = normalize_google_oauth_scope_list(
            [str(s).strip() for s in granted_scopes if str(s).strip()]
        )
        existing_tokens = tokens_get(user_id)
        existing_refresh_token = existing_tokens.get("refresh_token") if existing_tokens else None
        new_refresh_token = tokens.get("refresh_token")
        if not new_refresh_token or (
            isinstance(new_refresh_token, str) and (not new_refresh_token.strip())
        ):
            if existing_refresh_token:
                log.info(
                    "CALENDAR",
                    f"Google did not return refresh_token, preserving existing one for user {user_id}",
                )
                new_refresh_token = existing_refresh_token
            else:
                log.warn(
                    "CALENDAR",
                    f"Google did not return refresh_token and no existing refresh_token found for user {user_id}",
                )
                new_refresh_token = None
        else:
            log.info("CALENDAR", f"Google returned new refresh_token for user {user_id}")
        token_data = {
            "access_token": tokens["access_token"],
            "refresh_token": new_refresh_token,
            "token_uri": token_endpoint,
            "client_id": client_id,
            "scopes": actual_scopes if actual_scopes else " ".join(granted_scopes),
            "expiry": datetime.now(timezone.utc)
            + timedelta(seconds=tokens.get("expires_in", 3600)),
        }
        if not tokens_upsert(user_id, token_data):
            raise RuntimeError(f"Failed to store tokens for user {user_id}")
        log.info(
            "CALENDAR",
            "GOOGLE_TOKEN_EXCHANGE_SUCCESS",
            {
                "request_id": request_id,
                "user_id": user_id,
                "has_refresh_token": bool(new_refresh_token),
                "google_returned_refresh_token": bool(tokens.get("refresh_token")),
                "preserved_existing_refresh_token": bool(
                    existing_refresh_token and (not tokens.get("refresh_token"))
                ),
                "expires_in": tokens.get("expires_in"),
                "granted_scopes": granted_scopes,
            },
        )
        log_oauth_event("tokens_stored", user_id, granted_scopes=granted_scopes)
        return tokens
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log.error(
            "ERRORS",
            "GOOGLE_TOKEN_EXCHANGE_ERROR",
            {"request_id": request_id, "user_id": user_id, "error": error_msg},
        )
        log_oauth_event("token_exchange_error", user_id, error=error_msg)
        raise
