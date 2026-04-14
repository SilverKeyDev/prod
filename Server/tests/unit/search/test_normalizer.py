"""Tests for Slipstream listing normalizer.

Verifies that every field in a raw Slipstream API response is correctly
mapped to the internal property dict shape consumed by scoring,
persistence, post-filters, and client transforms.
"""

from __future__ import annotations

import pytest

from app.services.search.data.normalizer import normalize_listing, normalize_listings


def _make_raw(**overrides) -> dict:
    """Minimal raw Slipstream listing with sensible defaults."""
    base = {
        "id": "MLS-12345",
        "address": {
            "deliveryLine": "123 Main St",
            "street": "Main St",
            "city": "Atlanta",
            "state": "GA",
            "zip": "30301",
        },
        "beds": 3,
        "baths": {"total": 2.5, "full": 2, "half": 1},
        "coordinates": {"latitude": 33.749, "longitude": -84.388},
        "listPrice": 350000,
        "salePrice": None,
        "size": 1800,
        "lotSize": {"sqft": 8712, "acres": 0.2},
        "propertyType": "Single Family Residence",
        "listingType": "Residential",
        "status": "Active",
        "imageCount": 12,
        "images": [
            "https://photos.example.com/1.jpg",
            "https://photos.example.com/2.jpg",
        ],
        "yearBuilt": 2005,
        "daysOnMarket": 14,
        "description": "Beautiful home with central air, garage, pool.",
        "county": "Fulton",
        "subdivision": "Buckhead Estates",
        "newConstruction": False,
        "style": "Traditional",
        "associationFee": 150,
        "listingAgent": {"name": "Jane Doe"},
        "listingOffice": {"name": "Realty Corp"},
        "schools": [{"name": "Local Elementary"}],
    }
    base.update(overrides)
    return base


# ---- Identity / ID fields ----

class TestNormalizerIdentifiers:
    def test_zpid_from_id(self):
        out = normalize_listing(_make_raw(id="MLS-99999"))
        assert out["zpid"] == "MLS-99999"
        assert out["mls_home_id"] == "MLS-99999"

    def test_missing_id(self):
        raw = _make_raw()
        raw.pop("id", None)
        out = normalize_listing(raw)
        assert out["zpid"] is None
        assert out["mls_home_id"] is None


# ---- Address fields ----

class TestNormalizerAddress:
    def test_full_address_composed(self):
        out = normalize_listing(_make_raw())
        assert out["streetAddress"] == "123 Main St"
        assert out["city"] == "Atlanta"
        assert out["state"] == "GA"
        assert out["zipcode"] == "30301"
        assert "123 Main St" in out["address"]
        assert "Atlanta" in out["address"]

    def test_missing_address_object(self):
        out = normalize_listing(_make_raw(address=None))
        assert out["streetAddress"] == ""
        assert out["city"] == ""
        assert out["address"] == ""

    def test_fallback_to_street(self):
        out = normalize_listing(_make_raw(address={"street": "Elm St", "city": "Savannah", "state": "GA", "zip": "31401"}))
        assert out["streetAddress"] == "Elm St"


# ---- Numeric property fields ----

class TestNormalizerNumericFields:
    def test_bedrooms(self):
        assert normalize_listing(_make_raw(beds=4))["bedrooms"] == 4

    def test_bedrooms_missing(self):
        raw = _make_raw()
        raw.pop("beds", None)
        assert normalize_listing(raw)["bedrooms"] is None

    def test_bathrooms_from_nested(self):
        assert normalize_listing(_make_raw(baths={"total": 3, "full": 2, "half": 1}))["bathrooms"] == 3

    def test_bathrooms_as_number(self):
        assert normalize_listing(_make_raw(baths=2))["bathrooms"] == 2

    def test_bathrooms_missing(self):
        raw = _make_raw()
        raw.pop("baths", None)
        assert normalize_listing(raw)["bathrooms"] is None

    def test_living_area(self):
        assert normalize_listing(_make_raw(size=2200))["livingArea"] == 2200

    def test_living_area_missing(self):
        raw = _make_raw()
        raw.pop("size", None)
        assert normalize_listing(raw)["livingArea"] is None

    def test_price(self):
        assert normalize_listing(_make_raw(listPrice=500000))["price"] == 500000

    def test_sale_price(self):
        assert normalize_listing(_make_raw(salePrice=480000))["salePrice"] == 480000

    def test_year_built(self):
        assert normalize_listing(_make_raw(yearBuilt=1990))["yearBuilt"] == 1990

    def test_days_on_market(self):
        assert normalize_listing(_make_raw(daysOnMarket=45))["daysOnMarket"] == 45

    def test_days_on_zillow_alias(self):
        out = normalize_listing(_make_raw(daysOnMarket=45))
        assert out["daysOnZillow"] == 45
        assert out["daysOnZillow"] == out["daysOnMarket"]

    def test_sqft_alias(self):
        out = normalize_listing(_make_raw(size=2200))
        assert out["sqft"] == 2200
        assert out["sqft"] == out["livingArea"]

    def test_price_per_square_foot(self):
        out = normalize_listing(_make_raw(listPrice=360000, size=1800))
        assert out["pricePerSquareFoot"] == 200

    def test_price_per_square_foot_no_size(self):
        raw = _make_raw(listPrice=360000)
        raw.pop("size", None)
        out = normalize_listing(raw)
        assert out["pricePerSquareFoot"] is None


# ---- Coordinates ----

class TestNormalizerCoordinates:
    def test_lat_lon(self):
        out = normalize_listing(_make_raw())
        assert out["latitude"] == 33.749
        assert out["longitude"] == -84.388

    def test_missing_coordinates(self):
        out = normalize_listing(_make_raw(coordinates=None))
        assert out["latitude"] is None
        assert out["longitude"] is None


# ---- Lot size ----

class TestNormalizerLotSize:
    def test_lot_sqft_from_nested(self):
        out = normalize_listing(_make_raw(lotSize={"sqft": 10000, "acres": 0.23}))
        assert out["lotAreaValue"] == 10000
        assert out["lotAreaUnit"] == "sqft"
        assert out["lotAcres"] == 0.23

    def test_lot_missing(self):
        raw = _make_raw()
        raw.pop("lotSize", None)
        out = normalize_listing(raw)
        assert out["lotAreaValue"] is None
        assert out["lotAcres"] is None
        assert out["lotSize"] is None

    def test_lot_as_number(self):
        out = normalize_listing(_make_raw(lotSize=5000))
        assert out["lotAreaValue"] == 5000
        assert out["lotAcres"] is None

    def test_lot_size_formatted_string(self):
        out = normalize_listing(_make_raw(lotSize={"sqft": 8712, "acres": 0.2}))
        assert out["lotSize"] == "8,712 sqft"

    def test_lot_size_acres_only(self):
        out = normalize_listing(_make_raw(lotSize={"acres": 1.5}))
        assert out["lotSize"] == "1.5 acres"


# ---- Images ----

class TestNormalizerImages:
    def test_img_src_first_image(self):
        out = normalize_listing(_make_raw(images=["a.jpg", "b.jpg"]))
        assert out["imgSrc"] == "a.jpg"
        assert out["images"] == ["a.jpg", "b.jpg"]

    def test_no_images(self):
        out = normalize_listing(_make_raw(images=[]))
        assert out["imgSrc"] is None
        assert out["images"] == []

    def test_images_missing(self):
        raw = _make_raw()
        raw.pop("images", None)
        out = normalize_listing(raw)
        assert out["imgSrc"] is None


# ---- Type / status / flags ----

class TestNormalizerTypeStatus:
    def test_property_type(self):
        out = normalize_listing(_make_raw(propertyType="Townhouse"))
        assert out["propertyType"] == "Townhouse"
        assert out["homeType"] == "Townhouse"

    def test_listing_status(self):
        assert normalize_listing(_make_raw(status="Pending"))["listingStatus"] == "Pending"

    def test_new_construction_flag(self):
        assert normalize_listing(_make_raw(newConstruction=True))["newConstruction"] is True
        assert normalize_listing(_make_raw(newConstruction=False))["newConstruction"] is False

    def test_association_fee(self):
        assert normalize_listing(_make_raw(associationFee=200))["associationFee"] == 200


# ---- Rich detail fields ----

class TestNormalizerRichFields:
    def test_description(self):
        assert "Beautiful" in normalize_listing(_make_raw())["description"]

    def test_county_subdivision(self):
        out = normalize_listing(_make_raw())
        assert out["county"] == "Fulton"
        assert out["subdivision"] == "Buckhead Estates"

    def test_listing_agent_office(self):
        out = normalize_listing(_make_raw())
        assert out["listingAgent"]["name"] == "Jane Doe"
        assert out["listingOffice"]["name"] == "Realty Corp"

    def test_schools(self):
        out = normalize_listing(_make_raw())
        assert len(out["schools"]) == 1


# ---- Batch normalization ----

class TestNormalizeListings:
    def test_batch(self):
        results = normalize_listings([_make_raw(id="A"), _make_raw(id="B")])
        assert len(results) == 2
        assert results[0]["zpid"] == "A"
        assert results[1]["zpid"] == "B"

    def test_empty_batch(self):
        assert normalize_listings([]) == []
