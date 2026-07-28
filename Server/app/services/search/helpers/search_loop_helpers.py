"""
Helper functions for property search pagination via RapidAPI.
"""

from __future__ import annotations

import time
from typing import Any

from logger import log

from ..data.client import rapidapi_get

_MAX_429_RETRIES_PER_PAGE = 24

# RapidAPI filter keys forwarded from map_user_preferences_to_filters.
_RAPIDAPI_FILTER_KEYS = (
    "home_type",
    "bedsMin",
    "bathsMin",
    "minPrice",
    "maxPrice",
    "rentMinPrice",
    "rentMaxPrice",
    "minSqft",
    "maxSqft",
    "daysOnMarketMin",
    "daysOnMarketMax",
)


def search_properties_paginated(
    polygon_param: str,
    filters: dict[str, Any],
    status_type: str,
    per_pages: int,
    target_limit: int,
    request_id: str,
) -> tuple[list[dict[str, Any]], int, list[dict[str, Any]]]:
    """
    Search properties by paginating through RapidAPI ``/propertyByPolygon``.

    ``polygon_param`` must be a RapidAPI polygon string from ``to_polygon_param``
    (``"lon lat,lon lat,..."``).

    Returns:
        Tuple of (properties_list, requests_made_count, errors_list)
    """
    if not isinstance(polygon_param, str) or not polygon_param.strip():
        return [], 0, [{"error": "invalid_polygon_param"}]

    seen: set[str] = set()
    all_properties: list[dict[str, Any]] = []
    requests_made = 0
    errors: list[dict[str, Any]] = []

    # Some upstream versions use 0-based vs 1-based pages; try both starts.
    try_page_orders = [1, 0]

    for start_page in try_page_orders:
        for page in range(start_page, per_pages + 1):
            if len(all_properties) >= target_limit:
                break

            params: dict[str, Any] = {
                "polygon": polygon_param,
                "status_type": status_type,
                "page": page,
                "sort": "Price_Low_High",
            }

            if isinstance(filters, dict):
                if filters.get("home_type") is not None:
                    params["home_type"] = filters["home_type"]
                for key in _RAPIDAPI_FILTER_KEYS:
                    if key == "home_type":
                        continue
                    if filters.get(key) is not None:
                        params[key] = filters[key]

            rate_retries = 0
            page_fetched = False
            no_props_stop = False

            while not page_fetched:
                try:
                    resp = rapidapi_get("/propertyByPolygon", params=params)
                    requests_made += 1

                    if resp.status_code == 429:
                        rate_retries += 1
                        log.warn(
                            "POLYGON_SEARCH",
                            "Rate limited, sleeping",
                            {
                                "request_id": request_id,
                                "page": page,
                                "attempt": rate_retries,
                                "max_attempts": _MAX_429_RETRIES_PER_PAGE,
                            },
                        )
                        if rate_retries > _MAX_429_RETRIES_PER_PAGE:
                            errors.append(
                                {
                                    "page": page,
                                    "status": 429,
                                    "text": "rate_limit_retries_exhausted",
                                }
                            )
                            log.error(
                                "POLYGON_SEARCH",
                                "Rate limit retries exhausted",
                                {"request_id": request_id, "page": page},
                            )
                            page_fetched = True
                            break
                        time.sleep(1.25)
                        continue

                    if resp.status_code >= 400:
                        errors.append(
                            {
                                "page": page,
                                "status": resp.status_code,
                                "text": resp.text[:300],
                            }
                        )
                        log.error(
                            "POLYGON_SEARCH",
                            "RapidAPI error",
                            {
                                "request_id": request_id,
                                "status": resp.status_code,
                                "page": page,
                            },
                        )
                        page_fetched = True
                        break

                    result = resp.json() if resp.content else {}
                    props = (result or {}).get("props") or []
                    page_size = (result or {}).get("pageSize") or 20

                    log.debug(
                        "POLYGON_SEARCH",
                        "Paginated search page fetched",
                        {
                            "request_id": request_id,
                            "page": page,
                            "props_count": len(props),
                            "page_size": page_size,
                        },
                    )

                    if not props:
                        no_props_stop = True
                        page_fetched = True
                        break

                    for prop in props:
                        if len(all_properties) >= target_limit:
                            break
                        if not isinstance(prop, dict):
                            continue
                        zpid = prop.get("zpid")
                        if zpid is None:
                            continue
                        zpid_key = str(zpid)
                        if zpid_key not in seen:
                            seen.add(zpid_key)
                            # RapidAPI props are already Zillow-shaped; do NOT run
                            # Slipstream normalize_listing here (Phase 6 may add a thin adapter).
                            all_properties.append(prop)

                    if len(props) < int(page_size):
                        page_fetched = True
                        break

                    page_fetched = True

                except Exception as e:
                    errors.append({"page": page, "error": str(e)[:300]})
                    page_fetched = True
                    break

            if no_props_stop:
                break

        if len(all_properties) >= target_limit:
            break

    return all_properties, requests_made, errors
