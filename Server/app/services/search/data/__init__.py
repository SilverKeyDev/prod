"""Slipstream data module — single source for all property data fetching.

Reference JSON for a single-home ``/ws/listings/get`` response:
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from .client import get_slipstream_headers, slipstream_get, slipstream_post, validate_token
from .config import SLIPSTREAM_BASE, SLIPSTREAM_MARKET, SLIPSTREAM_PRIVATE
from .listings_active import search_active_listings
from .listings_inactive import search_inactive_listings
from .neighborhood_boundaries import geojson_to_viewport_ring, get_area_boundary, search_areas
from .normalizer import normalize_listing, normalize_listings
from .property_comps import get_property_comps
from .property_detail import get_property_detail
from .property_images import get_property_images
from .slipstream_response_reference import SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE

__all__ = [
    "SLIPSTREAM_BASE",
    "SLIPSTREAM_MARKET",
    "SLIPSTREAM_PRIVATE",
    "SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE",
    "geojson_to_viewport_ring",
    "get_area_boundary",
    "get_property_comps",
    "get_property_detail",
    "get_property_images",
    "get_slipstream_headers",
    "normalize_listing",
    "normalize_listings",
    "search_active_listings",
    "search_areas",
    "search_inactive_listings",
    "slipstream_get",
    "slipstream_post",
    "validate_token",
]
