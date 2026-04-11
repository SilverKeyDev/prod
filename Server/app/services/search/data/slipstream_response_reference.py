"""Reference: Slipstream HTTP JSON for a single listing (no runtime imports).

The sample below matches the envelope returned by ``GET /ws/listings/get`` with
``details=true`` (GAMLS). Field names align with ``normalize_listing`` in
``normalizer.py``. Values are anonymized; a live response is logged at debug
(API category) from ``get_property_detail`` after a successful parse.

Logged payloads use the same structure; the logger scrubs PII patterns.
"""

from __future__ import annotations

# fmt: off
SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE = r"""
{
  "success": true,
  "result": {
    "listings": [
      {
        "id": "GAMLS12345678",
        "address": {
          "deliveryLine": "123 Example St",
          "street": "123 Example St",
          "city": "Atlanta",
          "state": "GA",
          "zip": "30309"
        },
        "beds": 3,
        "baths": {
          "total": 2.5,
          "full": 2,
          "half": 1
        },
        "coordinates": {
          "latitude": 33.749,
          "longitude": -84.388
        },
        "listPrice": 450000,
        "salePrice": null,
        "size": 2100,
        "lotSize": {
          "sqft": 6000,
          "acres": 0.14
        },
        "propertyType": "Single Family",
        "listingType": "Residential",
        "status": "Active",
        "imageCount": 24,
        "images": [
          "https://cdn.example.com/mls/listing/a.jpg",
          "https://cdn.example.com/mls/listing/b.jpg"
        ],
        "yearBuilt": 1998,
        "daysOnMarket": 12,
        "description": "Sample listing description.",
        "style": "Traditional",
        "county": "Fulton",
        "subdivision": "Sample Estates",
        "schools": {},
        "listingAgent": {
          "name": "Sample Agent"
        },
        "listingOffice": {
          "name": "Sample Brokerage LLC"
        },
        "newConstruction": false,
        "associationFee": 150
      }
    ]
  }
}
"""
