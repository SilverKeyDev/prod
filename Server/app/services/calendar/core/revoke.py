"""Revoke Google Calendar OAuth access for a user."""

from app.services.auth.tokens import tokens_delete, tokens_get
from app.utils.security.security import log_oauth_event, sanitize_error_message
from logger import log


def revoke_calendar_access(user_id: str, session) -> bool:
    """Revoke Google OAuth access for a user. Returns True on success."""
    try:
        token_data = tokens_get(user_id)
        if not token_data:
            log.warn("CALENDAR", f"No tokens found for user {user_id} during revoke")
            return True
        refresh_token = token_data.get("refresh_token")
        if refresh_token:
            revoke_res = session.post(
                "https://oauth2.googleapis.com/revoke", params={"token": refresh_token}
            )
            if revoke_res.status_code != 200:
                log_oauth_event("revoke_failed", user_id, reason="google_revoke_failed")
                log.warn(
                    "CALENDAR", f"Google revoke failed for user {user_id}: {revoke_res.status_code}"
                )
        tokens_delete(user_id)
        log_oauth_event("revoke_success", user_id)
        return True
    except Exception as e:
        error_msg = sanitize_error_message(e)
        log_oauth_event("revoke_failed", user_id, reason="exception", error=error_msg)
        log.error("ERRORS", f"Error revoking access for user {user_id}: {error_msg}")
        raise
