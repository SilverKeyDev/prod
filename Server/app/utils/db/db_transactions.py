"""
Database transaction management utilities.
Provides context managers and decorators for safe database operations.
"""

from collections.abc import Callable
from contextlib import contextmanager

from flask import current_app

from app import db
from app.utils.security.db_reliability import reliable_db_commit


@contextmanager
def db_transaction():
    """
    Context manager for database transactions with automatic rollback on error.

    Usage:
        with db_transaction():
            # Database operations
            user.name = "New Name"
            # Commit happens automatically on success
        # Rollback happens automatically on exception

    Example:
        try:
            with db_transaction():
                user = get_model(User, user_id)
                user.name = "Updated"
                # If any exception occurs here, rollback is automatic
        except Exception as e:
            # Transaction already rolled back
            logger.error(f"Transaction failed: {e}")
    """
    try:
        yield
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def db_transaction_decorator(func: Callable) -> Callable:
    """
    Decorator that wraps a function with automatic transaction management.

    Usage:
        @db_transaction_decorator
        def update_user(user_id, name):
            user = get_model(User, user_id)
            user.name = name
            # Commit happens automatically

    Args:
        func: Function to wrap with transaction management

    Returns:
        Wrapped function with transaction handling
    """

    def wrapper(*args, **kwargs):
        with db_transaction():
            return func(*args, **kwargs)

    return wrapper


def safe_db_commit(operation_name: str = "database operation") -> None:
    """
    Perform a safe database commit with retry logic and error handling.
    Uses reliable_db_commit for critical operations.

    Args:
        operation_name: Name of the operation for logging purposes

    Raises:
        Exception: Re-raises any exception from the commit operation
    """
    try:
        reliable_db_commit(
            db_session=db.session, db_engine=db.engine, operation_name=operation_name
        )
    except Exception as e:
        current_app.logger.error(f"Failed to commit {operation_name}: {str(e)}")
        db.session.rollback()
        raise
