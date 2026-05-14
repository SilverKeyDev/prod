"""Shared mock helpers for Slipstream data module tests.

Provides factories for mocked HTTP responses and raw listing payloads so each
per-module test file can share the same scaffolding.
"""

from __future__ import annotations

from unittest.mock import MagicMock


def _mock_response(json_data: dict, status_code: int = 200, ok: bool = True):
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = ok
    resp.content = True
    resp.json.return_value = json_data
    resp.text = str(json_data)[:500]
    return resp


def _raw_listing(**overrides):
    base = {
        "id": "MLS-100",
        "address": {
            "deliveryLine": "100 Oak Ave",
            "city": "Atlanta",
            "state": "GA",
            "zip": "30301",
        },
        "beds": 4,
        "baths": {"total": 3, "full": 2, "half": 1},
        "coordinates": {"latitude": 33.75, "longitude": -84.39},
        "listPrice": 500000,
        "size": 2500,
        "lotSize": {"sqft": 12000, "acres": 0.28},
        "propertyType": "Single Family Residence",
        "status": "Active",
        "images": ["img1.jpg", "img2.jpg"],
        "yearBuilt": 2015,
        "daysOnMarket": 10,
        "description": "Nice home",
        "newConstruction": False,
    }
    base.update(overrides)
    return base
