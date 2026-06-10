"""
Helper functions for property search pagination via Slipstream API.
"""

from __future__ import annotations

import json
import time
from typing import Any

from logger import log

from ..data.client import slipstream_get
from ..data.config import SLIPSTREAM_MARKET
from ..data.normalizer import normalize_listing

_MAX_429_RETRIES_PER_PAGE = 24


def search_properties_paginated(
    polygon_param: str | dict,
    filters: dict[str, Any],
    status_type: str,
    per_pages: int,
    target_limit: int,
    request_id: str,
) -> tuple[list[dict[str, Any]], int, list[dict[str, Any]]]:
    """
    Search properties by paginating through Slipstream API results.

    ``polygon_param`` can be a GeoJSON dict or a JSON string (for backward compat).

    Returns:
        Tuple of (properties_list, requests_made_count, errors_list)
    """
    seen: set[str] = set()
    all_properties: list[dict[str, Any]] = []
    requests_made = 0
    errors: list[dict[str, Any]] = []

    page_size = min(target_limit, 1000)

    if isinstance(polygon_param, dict):
        polygon_json_str = json.dumps(polygon_param)
    else:
        polygon_json_str = polygon_param

    for page in range(1, per_pages + 1):
        if len(all_properties) >= target_limit:
            break

        params: dict[str, Any] = {
            "market": SLIPSTREAM_MARKET,
            "polygon": polygon_json_str,
            "pageNumber": page,
            "pageSize": page_size,
            "details": "true",
        }

        for key, value in filters.items():
            if value is not None:
                params[key] = value

        rate_retries = 0
        page_fetched = False
        no_listings_stop = False

        while not page_fetched:
            try:
                resp = slipstream_get("/ws/listings/search", params=params)
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
                        "Slipstream API error",
                        {"request_id": request_id, "status": resp.status_code},
                    )
                    page_fetched = True
                    break

                body = resp.json() if resp.content else {}
                if not body.get("success"):
                    err_msg = (body.get("error") or {}).get("message", "Unknown error")
                    errors.append({"page": page, "status": resp.status_code, "text": err_msg})
                    page_fetched = True
                    break

                result = body.get("result") or {}
                raw_listings = result.get("listings") or []
                paging = result.get("paging") or {}

                log.debug(
                    "POLYGON_SEARCH",
                    "Paginated search page fetched",
                    {
                        "request_id": request_id,
                        "page": page,
                        "listings_count": len(raw_listings),
                        "paging": paging,
                    },
                )

                log.debug(
                    "API",
                    "Slipstream /ws/listings/search response (paginated, first home only)",
                    {
                        "caller": "search_properties_paginated",
                        "endpoint": "/ws/listings/search",
                        "status_type": status_type,
                        "request_id": request_id,
                        "page": page,
                        "total_listings_this_page": len(raw_listings),
                        "paging": paging,
                        "first_listing": raw_listings[0] if raw_listings else None,
                    },
                )

                if not raw_listings:
                    no_listings_stop = True
                    page_fetched = True
                    break

                for raw in raw_listings:
                    if len(all_properties) >= target_limit:
                        break
                    listing_id = raw.get("id")
                    if listing_id and listing_id not in seen:
                        seen.add(listing_id)
                        all_properties.append(normalize_listing(raw))

                total_pages = paging.get("count", 1)
                if page >= total_pages:
                    no_listings_stop = True

                page_fetched = True

            except Exception as e:
                errors.append({"page": page, "error": str(e)[:300]})
                page_fetched = True
                break

        if no_listings_stop:
            break

    return all_properties, requests_made, errors
