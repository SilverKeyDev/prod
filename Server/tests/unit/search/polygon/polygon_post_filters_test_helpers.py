"""Shared helpers for polygon post-filter unit tests."""

from app.services.search.polygon.polygon_post_filters import (
    PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT,
)

__all__ = ["PREFERENCE_POST_FILTER_LENIENT_MAX_COUNT", "noop_debug_log"]


def noop_debug_log(*_args, **_kwargs) -> None:
    pass
