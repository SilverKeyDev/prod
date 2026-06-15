"""
Google OAuth Token Storage Interface
Provides a DB-agnostic interface for storing and retrieving Google OAuth tokens.
"""

from datetime import datetime, timezone
from typing import Any

from logger import log

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
        log.info("AUTH", f"Retrieved tokens for user {user_id}")
    else:
        log.info("AUTH", f"No tokens found for user {user_id}")
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
        log.error("ERRORS", "Cannot store tokens: user_id is required")
        return False
    try:
        token_data["updated_at"] = datetime.now(timezone.utc)
        if user_id not in _token_store:
            token_data["created_at"] = datetime.now(timezone.utc)
        _token_store[user_id] = token_data
        log.info("AUTH", f"Stored tokens for user {user_id}")
        return True
    except Exception as e:
        log.error("ERRORS", f"Failed to store tokens for user {user_id}: {str(e)}")
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
        log.error("ERRORS", "Cannot delete tokens: user_id is required")
        return False
    try:
        if user_id in _token_store:
            del _token_store[user_id]
            log.info("AUTH", f"Deleted tokens for user {user_id}")
        else:
            log.info("AUTH", f"No tokens to delete for user {user_id}")
        return True
    except Exception as e:
        log.error("ERRORS", f"Failed to delete tokens for user {user_id}: {str(e)}")
        return False


def tokens_list() -> dict[str, dict[str, Any]]:
    """
    List all stored tokens (for debugging/admin purposes).

    Returns:
        Dictionary of all stored tokens
    """
    return _token_store.copy()
