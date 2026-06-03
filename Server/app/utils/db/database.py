"""Database utilities including transaction management."""

from functools import wraps

from app import db
from logger import log


def transactional(func):
    """
    Decorator to wrap function in database transaction.

    Commits on success, rolls back on exception.
    Prevents partial commits and ensures data consistency.

    Usage:
        @transactional
        def my_service_method():
            # All database operations
            # Automatic commit on success, rollback on exception
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            db.session.commit()
            return result
        except Exception as e:
            db.session.rollback()
            log.error(
                "ERRORS",
                f"Transaction rolled back in {func.__name__}",
                {"error": str(e), "function": func.__name__},
            )
            raise

    return wrapper
