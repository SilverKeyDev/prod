"""Home age post-filter for polygon search."""

from datetime import datetime, timezone

from app.services.search.helpers.home_age_preference_filter import (
    home_age_years_for_property,
    property_kept_for_home_age_range,
)
from logger import LOG_CATEGORIES, log

_POLY = LOG_CATEGORIES["POLYGON_SEARCH"]


def apply_home_age_filter(
    all_properties: list,
    age_min: int | None,
    age_max: int | None,
    request_id: str,
    log_fn,
) -> list:
    """Apply home age range filter (years since build)."""
    if age_min is None and age_max is None:
        return all_properties

    current_year = datetime.now(tz=timezone.utc).year

    _before_age = len(all_properties)
    if _before_age > 0:

        def _age_out_of_range(p):
            return not property_kept_for_home_age_range(
                p,
                age_min=age_min,
                age_max=age_max,
                current_year=current_year,
            )

        miss_age = sum(
            1 for p in all_properties if home_age_years_for_property(p, current_year) is None
        )
        out_age = sum(1 for p in all_properties if _age_out_of_range(p))
    else:
        miss_age = out_age = 0

    all_properties = [
        p
        for p in all_properties
        if property_kept_for_home_age_range(
            p,
            age_min=age_min,
            age_max=age_max,
            current_year=current_year,
        )
    ]
    log_fn(
        request_id,
        "home_age",
        _before_age,
        len(all_properties),
        {"age_min": age_min, "age_max": age_max},
    )
    if len(all_properties) == 0 and _before_age > 0:
        log.warn(
            _POLY,
            "polygon_search post_filter dropped all (home_age)",
            {
                "request_id": request_id,
                "before": _before_age,
                "age_min": age_min,
                "age_max": age_max,
                "missing_year_built": miss_age,
                "out_of_range_age": out_age,
            },
        )
    return all_properties
