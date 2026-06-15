"""
Database reliability utilities for handling connection issues and retries.

This module provides standardized functions for database operations with
automatic retry logic, connection management, and error handling.
"""

import time
from collections.abc import Callable
from typing import Any

from sqlalchemy.exc import DisconnectionError, OperationalError

from logger import log


def with_db_retry(
    operation: Callable,
    db_session,
    db_engine,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    operation_name: str = "database operation",
    dispose_engine: bool = True,
) -> Any:
    """
    Execute a database operation with automatic retry logic and connection management.

    Args:
        operation: The database operation function to execute
        db_session: SQLAlchemy database session
        db_engine: SQLAlchemy database engine
        max_retries: Maximum number of retry attempts (default: 3)
        initial_delay: Initial delay between retries in seconds (default: 1.0)
        operation_name: Name of the operation for logging purposes
        dispose_engine: Whether to dispose engine before operation (default: True)

    Returns:
        Result of the operation function

    Raises:
        Exception: Re-raises the last exception if all retries are exhausted
    """

    # Dispose engine before operation for better reliability
    if dispose_engine:
        try:
            db_engine.dispose()
        except Exception as e:
            log.warn(
                "ERRORS",
                "Failed to dispose engine before operation",
                {"operation": operation_name, "error": str(e)},
            )

    retry_delay = initial_delay
    last_exception = None

    for attempt in range(max_retries):
        try:
            result = operation()
            return result

        except (OperationalError, DisconnectionError) as e:
            last_exception = e
            log.warn(
                "ERRORS",
                "Database connection error; retrying",
                {
                    "operation": operation_name,
                    "attempt": attempt + 1,
                    "max_retries": max_retries,
                    "error": str(e),
                },
            )

            # Clean up session
            try:
                db_session.rollback()
                db_session.remove()
            except Exception:
                pass

            # Dispose engine to force reconnection
            try:
                db_engine.dispose()
            except Exception:
                pass

            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                log.error(
                    "ERRORS",
                    "Max database retries exceeded",
                    {"operation": operation_name},
                )

        except Exception as e:
            last_exception = e
            log.error(
                "ERRORS",
                "Non-connection database error",
                {"operation": operation_name, "error": str(e)},
            )
            try:
                db_session.rollback()
            except Exception:
                pass
            break  # Don't retry non-connection errors

    # Re-raise the last exception if we get here (last_exception is set in the loops above)
    if last_exception is not None:
        raise last_exception
    raise RuntimeError(f"Max retries exceeded for {operation_name} with no exception captured")


def reliable_db_commit(db_session, db_engine, operation_name: str = "commit") -> None:
    """
    Perform a database commit with automatic retry logic.

    Args:
        db_session: SQLAlchemy database session
        db_engine: SQLAlchemy database engine
        operation_name: Name of the operation for logging purposes
    """

    def commit_operation():
        db_session.commit()
        return None

    return with_db_retry(
        operation=commit_operation,
        db_session=db_session,
        db_engine=db_engine,
        operation_name=operation_name,
    )


def reliable_db_refresh(db_session, db_engine, obj, operation_name: str = "refresh") -> None:
    """
    Perform a database object refresh with automatic retry logic.

    Args:
        db_session: SQLAlchemy database session
        db_engine: SQLAlchemy database engine
        obj: Database object to refresh
        operation_name: Name of the operation for logging purposes
    """

    def refresh_operation():
        db_session.refresh(obj)
        return None

    return with_db_retry(
        operation=refresh_operation,
        db_session=db_session,
        db_engine=db_engine,
        operation_name=operation_name,
    )


def reliable_db_query(
    db_session, db_engine, query_func: Callable, operation_name: str = "query"
) -> Any:
    """
    Perform a database query with automatic retry logic.

    Args:
        db_session: SQLAlchemy database session
        db_engine: SQLAlchemy database engine
        query_func: Function that performs the database query
        operation_name: Name of the operation for logging purposes

    Returns:
        Result of the query function
    """
    return with_db_retry(
        operation=query_func,
        db_session=db_session,
        db_engine=db_engine,
        operation_name=operation_name,
    )


def dispose_engine_safely(db_engine, operation_name: str = "operation") -> None:
    """
    Safely dispose database engine with error handling.

    Args:
        db_engine: SQLAlchemy database engine
        operation_name: Name of the operation for logging purposes
    """
    try:
        db_engine.dispose()
    except Exception as e:
        log.warn(
            "ERRORS",
            "Failed to dispose engine before operation",
            {"operation": operation_name, "error": str(e)},
        )
