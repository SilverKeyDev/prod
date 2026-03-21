"""
Helper functions for property search pagination and API requests.
"""

from __future__ import annotations

import time
from typing import Any

import requests
from flask import current_app

from ..api_client import API_BASE, get_rapidapi_headers

# RapidAPI / upstream may return 429; retry the same page (do not advance page on throttle).
_MAX_429_RETRIES_PER_PAGE = 24


def search_properties_paginated(
    polygon_param: str,
    filters: dict[str, Any],
    status_type: str,
    per_pages: int,
    target_limit: int,
    request_id: str,
) -> tuple[list[dict[str, Any]], int, list[dict[str, Any]]]:
    """
    Search properties by paginating through API results.

    Returns:
        Tuple of (properties_list, requests_made_count, errors_list)
    """
    headers = get_rapidapi_headers()
    seen = set()
    all_properties = []
    requests_made = 0
    errors = []
    try_page_orders = [1, 0]

    for start_page in try_page_orders:
        for page in range(start_page, per_pages + 1):
            if len(all_properties) >= target_limit:
                break

            params = {
                "polygon": polygon_param,
                "status_type": status_type,
                "page": page,
                "sort": "Price_Low_High",
            }

            # Apply filters
            if filters.get("home_type"):
                params["home_type"] = filters["home_type"]
            for key in ("bedsMin", "bathsMin", "minPrice", "maxPrice"):
                if filters.get(key) is not None:
                    params[key] = filters[key]

            rate_retries = 0
            page_fetched = False
            no_props_stop_pagination = False
            while not page_fetched:
                try:
                    resp = requests.get(
                        f"{API_BASE}/propertyByPolygon",
                        headers=headers,
                        params=params,
                        timeout=300,
                    )
                    requests_made += 1

                    if resp.status_code == 429:
                        rate_retries += 1
                        current_app.logger.warning(
                            f"⏳ {request_id} - Rate limited, sleeping... "
                            f"(page={page}, attempt={rate_retries}/{_MAX_429_RETRIES_PER_PAGE})"
                        )
                        current_app.logger.debug(
                            "[POLYGON_SEARCH] %s - 429 on propertyByPolygon page=%s params_keys=%s",
                            request_id,
                            page,
                            sorted(params.keys()),
                        )
                        if rate_retries > _MAX_429_RETRIES_PER_PAGE:
                            err = {
                                "page": page,
                                "status": 429,
                                "text": "rate_limit_retries_exhausted",
                            }
                            errors.append(err)
                            current_app.logger.error(
                                f"❌ {request_id} - Rate limit retries exhausted for page {page}"
                            )
                            page_fetched = True
                            break
                        time.sleep(1.25)
                        continue

                    if resp.status_code >= 400:
                        error_detail = {
                            "page": page,
                            "status": resp.status_code,
                            "text": resp.text[:300],
                        }
                        errors.append(error_detail)
                        current_app.logger.error(f"❌ {request_id} - API error: {error_detail}")
                        page_fetched = True
                        break

                    result = resp.json() if resp.content else {}
                    props = (result or {}).get("props") or []
                    page_size = (result or {}).get("pageSize") or 20

                    current_app.logger.debug(
                        "[POLYGON_SEARCH] %s - page=%s props=%s pageSize=%s",
                        request_id,
                        page,
                        len(props),
                        page_size,
                    )

                    if not props:
                        no_props_stop_pagination = True
                        page_fetched = True
                        break

                    for prop in props:
                        if len(all_properties) >= target_limit:
                            break
                        zpid = prop.get("zpid")
                        if zpid and zpid not in seen:
                            seen.add(zpid)
                            all_properties.append(prop)

                    if len(props) < int(page_size):
                        page_fetched = True
                        break

                    page_fetched = True

                except Exception as e:
                    errors.append({"page": page, "error": str(e)[:300]})
                    page_fetched = True
                    break

            if no_props_stop_pagination:
                break

        if len(all_properties) >= target_limit:
            break

    return all_properties, requests_made, errors
