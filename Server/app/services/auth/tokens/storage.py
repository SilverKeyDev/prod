"""
Google OAuth Token Storage Interface
Provides a DB-agnostic interface for storing and retrieving Google OAuth tokens.
Now uses database-backed storage for persistence across sessions.
"""

from datetime import datetime, timezone
from typing import Any

from app import db
from app.models import GoogleOAuthToken
from app.utils.security.app_logging import get_logger

logger = get_logger()


def tokens_get(user_id: str) -> dict[str, Any] | None:
    """
    Retrieve Google OAuth tokens for a user from the database.

    Args:
        user_id: User identifier (must be a valid UUID string)

    Returns:
        Dictionary containing token data or None if not found
    """
    if not user_id:
        logger.debug("tokens_get called with empty user_id")
        return None

    try:
        token_record = GoogleOAuthToken.query.filter_by(user_id=user_id).first()
        if token_record:
            logger.debug(f"Retrieved tokens for user {user_id}")
            return token_record.to_dict()
        else:
            logger.debug(f"No tokens found for user {user_id}")
            return None
    except Exception as e:
        logger.error(f"Error retrieving tokens for user {user_id}: {str(e)}", exc_info=True)
        return None


def tokens_upsert(user_id: str, token_data: dict[str, Any]) -> bool:
    """
    Store or update Google OAuth tokens for a user in the database.

    Args:
        user_id: User identifier (must be a valid UUID string)
        token_data: Dictionary containing token information with required fields:
                   - access_token (required)
                   - token_uri (required)
                   - client_id (required)
                   - scopes (required, can be empty string)
                   - refresh_token (optional)
                   - expiry (optional)
                   Note: client_secret is no longer stored - always use config value

    Returns:
        True if successful, False otherwise
    """
    if not user_id:
        logger.error("Cannot store tokens: user_id is required")
        return False

    # Validate required fields (client_secret removed - always use config)
    required_fields = ["access_token", "token_uri", "client_id", "scopes"]
    missing_fields = [
        field for field in required_fields if field not in token_data or token_data[field] is None
    ]
    if missing_fields:
        logger.error(
            f"Cannot store tokens for user {user_id}: missing required fields: {', '.join(missing_fields)}"
        )
        return False

    # Ensure scopes is a string (can be empty string)
    if not isinstance(token_data.get("scopes"), str):
        if isinstance(token_data.get("scopes"), list):
            token_data["scopes"] = " ".join(token_data["scopes"])
        else:
            token_data["scopes"] = str(token_data.get("scopes", ""))

    # Verify user exists (foreign key constraint will also check, but this gives better error)
    try:
        from app.models import User

        user = User.query.filter_by(id=user_id).first()
        if not user:
            logger.error(f"Cannot store tokens: user {user_id} does not exist")
            return False
    except Exception as e:
        logger.error(f"Error verifying user {user_id} exists: {str(e)}", exc_info=True)
        return False

    # Lazy import to avoid circular dependency with calendar.permissions
    from app.services.calendar.permissions import update_token_permissions_from_scopes

    try:
        # Check if token record already exists
        token_record = GoogleOAuthToken.query.filter_by(user_id=user_id).first()

        if token_record:
            # Update existing record
            token_record.access_token = token_data["access_token"]
            # Preserve existing refresh_token if new one is not provided
            # Google may not return refresh_token on subsequent token refreshes
            new_refresh_token = token_data.get("refresh_token")
            # Normalize empty strings to None (defensive programming)
            if isinstance(new_refresh_token, str) and not new_refresh_token.strip():
                new_refresh_token = None
            if new_refresh_token:
                token_record.refresh_token = new_refresh_token
            # If new_refresh_token is None or empty, keep the existing one (don't overwrite with None)
            token_record.token_uri = token_data["token_uri"]
            token_record.client_id = token_data["client_id"]
            # client_secret removed - always use config value
            token_record.scopes = token_data["scopes"] if token_data["scopes"] else ""
            token_record.expiry = token_data.get("expiry")
            # Update permission flags from scopes
            update_token_permissions_from_scopes(token_record, token_record.scopes)
            token_record.updated_at = datetime.now(timezone.utc)
        else:
            # Create new record
            # Normalize empty strings to None for refresh_token
            refresh_token = token_data.get("refresh_token")
            if isinstance(refresh_token, str) and not refresh_token.strip():
                refresh_token = None

            token_record = GoogleOAuthToken(
                user_id=user_id,
                access_token=token_data["access_token"],
                refresh_token=refresh_token,
                token_uri=token_data["token_uri"],
                client_id=token_data["client_id"],
                # client_secret removed - always use config value
                scopes=token_data["scopes"] if token_data.get("scopes") else "",
                expiry=token_data.get("expiry"),
            )
            # Update permission flags from scopes
            update_token_permissions_from_scopes(token_record, token_record.scopes)
            db.session.add(token_record)

        db.session.commit()
        logger.info(f"Stored tokens for user {user_id}")
        return True
    except Exception as e:
        db.session.rollback()
        # Check for foreign key constraint violation
        error_str = str(e).lower()
        if "foreign key" in error_str or "constraint" in error_str:
            logger.error(
                f"Failed to store tokens for user {user_id}: user does not exist in database"
            )
        else:
            logger.error(f"Failed to store tokens for user {user_id}: {str(e)}", exc_info=True)
        return False


def tokens_delete(user_id: str) -> bool:
    """
    Delete Google OAuth tokens for a user from the database.

    Args:
        user_id: User identifier

    Returns:
        True if successful, False otherwise
    """
    if not user_id:
        logger.error("Cannot delete tokens: user_id is required")
        return False

    try:
        token_record = GoogleOAuthToken.query.filter_by(user_id=user_id).first()
        if token_record:
            db.session.delete(token_record)
            db.session.commit()
            logger.info(f"Deleted tokens for user {user_id}")
        else:
            logger.info(f"No tokens to delete for user {user_id}")
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete tokens for user {user_id}: {str(e)}", exc_info=True)
        return False
