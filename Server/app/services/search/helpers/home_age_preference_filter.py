"""Post-filter helpers: user preferred home age (years) vs listing year built."""

from __future__ import annotations

from typing import Any

from app.services.search.helpers.listing_type_match import _year_built_int


def home_age_years_for_property(prop: dict[str, Any], current_year: int) -> int | None:
    """Years since build, or None if year built unknown."""
    yb = _year_built_int(prop)
    if yb is None:
        return None
    return current_year - yb


def property_kept_for_home_age_range(
    prop: dict[str, Any],
    *,
    age_min: int | None,
    age_max: int | None,
    current_year: int,
) -> bool:
    """
    Match polygon_search_runner rules: missing year built => keep listing.
    Otherwise keep if age in [age_min, age_max] (inclusive; None bound = open).
    """
    age_y = home_age_years_for_property(prop, current_year)
    if age_y is None:
        return True
    if age_min is not None and age_y < age_min:
        return False
    if age_max is not None and age_y > age_max:
        return False
    return True
