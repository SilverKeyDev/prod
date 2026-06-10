"""Tests for parse_log_path."""

import pytest

from logger.core.categories import LogCategory
from logger.core.parse_log_path import parse_log_path


def test_parse_top_level_path_string() -> None:
    parsed = parse_log_path("AUTH")
    assert parsed.category == LogCategory.AUTH
    assert parsed.category_label == "AUTH"
    assert parsed.subcategory is None


def test_parse_log_category_enum_value() -> None:
    parsed = parse_log_path(LogCategory.SEARCH)
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
