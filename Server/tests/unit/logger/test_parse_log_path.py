"""Tests for parse_log_path."""

import pytest

from logger.core.categories import LOG_CATEGORIES, LogCategory
from logger.core.parse_log_path import parse_log_path


def test_parse_legacy_enum_category() -> None:
    parsed = parse_log_path(LogCategory.AUTH)
    assert parsed.category == LogCategory.AUTH
    assert parsed.category_label == "AUTH"
    assert parsed.subcategory is None


def test_parse_bare_string_category() -> None:
    parsed = parse_log_path("SEARCH")
    assert parsed.category == LogCategory.SEARCH
    assert parsed.category_label == "SEARCH"


def test_parse_api_dot_notation() -> None:
    parsed = parse_log_path("API.POLLING")
    assert parsed.category == LogCategory.API
    assert parsed.subcategory == "POLLING"
    assert parsed.category_label == "API.POLLING"


def test_parse_unknown_path_raises() -> None:
    with pytest.raises(ValueError, match="Unknown log path"):
        parse_log_path("AUTH.LOGIN")


def test_log_categories_dict_matches_enum() -> None:
    assert set(LOG_CATEGORIES.keys()) == {member.name for member in LogCategory}
