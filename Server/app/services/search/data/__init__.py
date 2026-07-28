"""Search data module.

RapidAPI: listings (polygon search, detail, images, comps).
Slipstream: geographic area suggestions and boundary polygons only.

Historical Slipstream listing envelope (reference only):
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from .client import (
    get_rapidapi_headers,
    get_slipstream_headers,
    rapidapi_get,
    slipstream_get,
    slipstream_post,
    validate_token,
)
from .config import (
    RAPIDAPI_BASE,
    RAPIDAPI_HOST,
    RAPIDAPI_KEY,
    SLIPSTREAM_BASE,
    SLIPSTREAM_MARKET,
    SLIPSTREAM_PRIVATE,
)
from .neighborhood_boundaries import geojson_to_viewport_ring, get_area_boundary, search_areas
from .normalizer import normalize_listing, normalize_listings
from .property.property_comps import get_property_comps
from .property.property_detail import get_property_detail
from .property.property_images import get_property_images
from .slipstream_response_reference import SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE

__all__ = [
    "RAPIDAPI_BASE",
    "RAPIDAPI_HOST",
    "RAPIDAPI_KEY",
    "SLIPSTREAM_BASE",
    "SLIPSTREAM_MARKET",
    "SLIPSTREAM_PRIVATE",
    "SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE",
    "geojson_to_viewport_ring",
    "get_area_boundary",
    "get_property_comps",
    "get_property_detail",
    "get_property_images",
    "get_rapidapi_headers",
    "get_slipstream_headers",
    "normalize_listing",
    "normalize_listings",
    "rapidapi_get",
    "search_areas",
    "slipstream_get",
    "slipstream_post",
    "validate_token",
]
