"""Helpers to detect OpenAPI validation decorators on Flask view functions."""

from collections.abc import Callable
from typing import Any

from pydantic import BaseModel

from .shared import OPENAPI_VALIDATE_FORM_ATTR, OPENAPI_VALIDATE_REQUEST_ATTR


def has_request_validation_decorator(func: Callable[..., Any]) -> bool:
    """Return True if the view has @validate_request or @validate_form_request applied."""
    current: Callable[..., Any] | None = func
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if getattr(current, OPENAPI_VALIDATE_REQUEST_ATTR, None) is not None:
            return True
        if getattr(current, OPENAPI_VALIDATE_FORM_ATTR, None) is not None:
            return True
        current = getattr(current, "__wrapped__", None)
    return False


def has_validation_decorator(func: Callable[..., Any]) -> bool:
    """
    Check if a function has request or response validation decorators applied.

    Prefer has_request_validation_decorator for POST/PUT/PATCH body coverage checks.
    """
    if has_request_validation_decorator(func):
        return True

    current: Callable[..., Any] | None = func
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if hasattr(current, "__closure__") and current.__closure__:
            for cell in current.__closure__:
                try:
                    if isinstance(cell.cell_contents, type) and issubclass(
                        cell.cell_contents, BaseModel
                    ):
                        return True
                except (TypeError, AttributeError):
                    continue
        current = getattr(current, "__wrapped__", None)
    return False
