"""Shared mock helpers for RapidAPI search data module tests.

Provides factories for mocked HTTP responses and Zillow-shaped property payloads.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock


def _mock_response(json_data: Any, status_code: int = 200, ok: bool = True):
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = ok
    resp.content = True
    resp.json.return_value = json_data
    resp.text = str(json_data)[:500]
    return resp


def _rapidapi_property(**overrides: Any) -> dict[str, Any]:
    """Minimal Zillow-shaped property dict as returned by RapidAPI /property."""
    base: dict[str, Any] = {
        "zpid": "12345",
        "streetAddress": "100 Oak Ave",
        "city": "Atlanta",
        "state": "GA",
        "zipcode": "30301",
        "bedrooms": 4,
        "bathrooms": 3,
        "latitude": 33.75,
        "longitude": -84.39,
        "price": 500000,
        "livingArea": 2500,
        "lotAreaValue": 12000,
        "lotAreaUnit": "sqft",
        "homeType": "SINGLE_FAMILY",
        "propertyType": "Single Family",
        "listingStatus": "FOR_SALE",
        "imgSrc": "img1.jpg",
        "images": ["img1.jpg", "img2.jpg"],
        "yearBuilt": 2015,
        "daysOnZillow": 10,
    }
    base.update(overrides)
    return base


# Backward-compatible alias for older Slipstream-era test names still imported elsewhere.
def _raw_listing(**overrides: Any) -> dict[str, Any]:
    return _rapidapi_property(**overrides)
