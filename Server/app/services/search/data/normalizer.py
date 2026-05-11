"""Normalize Slipstream listings and slim rows for search API responses.

Field names confirmed via live API responses (Phase 0 discovery).
The output dict matches what scoring, persistence, and client transforms expect.

Full Slipstream envelope for one home (``body`` from ``/ws/listings/get``): see
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``; live responses are
debug-logged from ``get_property_detail``.
"""

from __future__ import annotations

from .listings.listing_normalizer import normalize_listing, normalize_listings
from .search_response_slim import (
    flat_slim_row_to_openapi_property_search_result,
    slim_properties_for_search_response,
    slim_property_for_search_response,
)

__all__ = [
    "flat_slim_row_to_openapi_property_search_result",
    "normalize_listing",
    "normalize_listings",
    "slim_properties_for_search_response",
    "slim_property_for_search_response",
]
