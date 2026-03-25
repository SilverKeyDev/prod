"""Unit tests for home_age_preference_filter."""

from app.services.search.helpers.home_age_preference_filter import (
    home_age_years_for_property,
    property_kept_for_home_age_range,
)


def test_home_age_years_none_without_year_built() -> None:
    assert home_age_years_for_property({}, current_year=2026) is None


def test_home_age_years_computed() -> None:
    assert home_age_years_for_property({"yearBuilt": 2016}, current_year=2026) == 10


def test_kept_when_year_built_missing() -> None:
    assert property_kept_for_home_age_range(
        {},
        age_min=5,
        age_max=20,
        current_year=2026,
    )


def test_kept_when_age_in_range() -> None:
    prop = {"yearBuilt": 2016}
    assert property_kept_for_home_age_range(
        prop,
        age_min=5,
        age_max=20,
        current_year=2026,
    )


def test_dropped_when_too_new() -> None:
    prop = {"yearBuilt": 2025}
    assert not property_kept_for_home_age_range(
        prop,
        age_min=10,
        age_max=50,
        current_year=2026,
    )


def test_dropped_when_too_old() -> None:
    prop = {"yearBuilt": 1980}
    assert not property_kept_for_home_age_range(
        prop,
        age_min=5,
        age_max=20,
        current_year=2026,
    )


def test_open_max_bound() -> None:
    prop = {"yearBuilt": 1960}
    assert property_kept_for_home_age_range(
        prop,
        age_min=30,
        age_max=None,
        current_year=2026,
    )
