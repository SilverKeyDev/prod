"""
Google OAuth Token Storage Interface
Provides a DB-agnostic interface for storing and retrieving Google OAuth tokens.
"""

from datetime import datetime, timezone
from typing import Any

from ...utils.security.app_logging import get_logger

logger = get_logger()

# In-memory storage for development/testing
# TODO: Replace with actual database implementation
_token_store: dict[str, dict[str, Any]] = {}


def tokens_get(user_id: str) -> dict[str, Any] | None:
    """
    Retrieve Google OAuth tokens for a user.

    Args:
        user_id: User identifier

    Returns:
        Dictionary containing token data or None if not found
    """
    if not user_id:
        return None

    tokens = _token_store.get(user_id)
    if tokens:
        logger.info(f"Retrieved tokens for user {user_id}")
    else:
        logger.info(f"No tokens found for user {user_id}")
    return tokens


def tokens_upsert(user_id: str, token_data: dict[str, Any]) -> bool:
    """
    Store or update Google OAuth tokens for a user.

    Args:
        user_id: User identifier
        token_data: Dictionary containing token information

    Returns:
        True if successful, False otherwise
    """
    if not user_id:
        logger.error("Cannot store tokens: user_id is required")
        return False

    try:
        # Add metadata
        token_data["updated_at"] = datetime.now(timezone.utc)
        if user_id not in _token_store:
            token_data["created_at"] = datetime.now(timezone.utc)

        _token_store[user_id] = token_data
        logger.info(f"Stored tokens for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to store tokens for user {user_id}: {str(e)}")
        return False


def tokens_delete(user_id: str) -> bool:
    """
    Delete Google OAuth tokens for a user.

    Args:
        user_id: User identifier

    Returns:
        True if successful, False otherwise
    """
    if not user_id:
        logger.error("Cannot delete tokens: user_id is required")
        return False

    try:
        if user_id in _token_store:
            del _token_store[user_id]
            logger.info(f"Deleted tokens for user {user_id}")
        else:
            logger.info(f"No tokens to delete for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete tokens for user {user_id}: {str(e)}")
        return False


def tokens_list() -> dict[str, dict[str, Any]]:
    """
    List all stored tokens (for debugging/admin purposes).

    Returns:
        Dictionary of all stored tokens
    """
    return _token_store.copy()


# TODO: Implement database-backed storage
# Example schema for future database implementation:
"""
CREATE TABLE user_google_tokens (
    user_id UUID PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_uri TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    scopes TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
"""
