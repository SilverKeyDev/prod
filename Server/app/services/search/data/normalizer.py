"""Normalize RapidAPI (and legacy Slipstream) listings; slim rows for search API responses.

The output dict matches what scoring, persistence, and client transforms expect.
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
