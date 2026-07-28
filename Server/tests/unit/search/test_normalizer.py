"""Tests for RapidAPI-first listing normalizer.

Verifies RapidAPI / Zillow-shaped props map to the internal property dict
consumed by scoring, persistence, post-filters, and client transforms.
Also covers the legacy Slipstream fallback path.
"""

from __future__ import annotations

from app.services.search.data.normalizer import normalize_listing, normalize_listings
from app.services.search.data.search_response_slim import slim_properties_for_search_response


def _make_raw(**overrides) -> dict:
    """Minimal raw RapidAPI listing with sensible defaults."""
    base = {
        "zpid": 12345,
        "streetAddress": "123 Main St",
        "city": "Atlanta",
        "state": "GA",
        "zipcode": "30301",
        "bedrooms": 3,
        "bathrooms": 2.5,
        "latitude": 33.749,
        "longitude": -84.388,
        "price": 350000,
        "salePrice": None,
        "livingArea": 1800,
        "lotAreaValue": 8712,
        "lotAreaUnit": "sqft",
        "homeType": "SINGLE_FAMILY",
        "propertyType": "Single Family",
        "listingStatus": "FOR_SALE",
        "imgSrc": "https://photos.example.com/1.jpg",
        "images": [
            "https://photos.example.com/1.jpg",
            "https://photos.example.com/2.jpg",
        ],
        "yearBuilt": 2005,
        "daysOnZillow": 14,
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
    def test_zpid_stringified(self):
        out = normalize_listing(_make_raw(zpid=99999))
        assert out["zpid"] == "99999"
        assert out["mls_home_id"] == "99999"

    def test_missing_zpid(self):
        raw = _make_raw()
        raw.pop("zpid", None)
        # Still RapidAPI-shaped via streetAddress/bedrooms
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

    def test_missing_address_fields(self):
        out = normalize_listing(
            _make_raw(streetAddress="", city="", state="", zipcode="", address=None)
        )
        assert out["streetAddress"] == ""
        assert out["city"] == ""
        assert out["address"] == ""

    def test_string_address_fallback(self):
        out = normalize_listing(
            _make_raw(
                streetAddress="",
                city="",
                state="",
                zipcode="",
                address="Elm St, Savannah, GA 31401",
            )
        )
        assert out["address"] == "Elm St, Savannah, GA 31401"


# ---- Numeric property fields ----


class TestNormalizerNumericFields:
    def test_bedrooms(self):
        assert normalize_listing(_make_raw(bedrooms=4))["bedrooms"] == 4

    def test_bedrooms_missing(self):
        raw = _make_raw()
        raw.pop("bedrooms", None)
        assert normalize_listing(raw)["bedrooms"] is None

    def test_bathrooms(self):
        assert normalize_listing(_make_raw(bathrooms=3))["bathrooms"] == 3

    def test_bathrooms_missing(self):
        raw = _make_raw()
        raw.pop("bathrooms", None)
        assert normalize_listing(raw)["bathrooms"] is None

    def test_living_area(self):
        assert normalize_listing(_make_raw(livingArea=2200))["livingArea"] == 2200

    def test_living_area_missing(self):
        raw = _make_raw()
        raw.pop("livingArea", None)
        raw.pop("sqft", None)
        assert normalize_listing(raw)["livingArea"] is None

    def test_price(self):
        assert normalize_listing(_make_raw(price=500000))["price"] == 500000

    def test_price_from_unformatted(self):
        raw = {
            "zpid": 1,
            "streetAddress": "1 Main",
            "city": "Atlanta",
            "state": "GA",
            "zipcode": "30301",
            "unformattedPrice": 425000,
        }
        assert normalize_listing(raw)["price"] == 425000

    def test_sale_price(self):
        assert normalize_listing(_make_raw(salePrice=480000))["salePrice"] == 480000

    def test_year_built(self):
        assert normalize_listing(_make_raw(yearBuilt=1990))["yearBuilt"] == 1990

    def test_days_on_zillow(self):
        assert normalize_listing(_make_raw(daysOnZillow=45))["daysOnZillow"] == 45

    def test_days_on_market_alias(self):
        out = normalize_listing(_make_raw(daysOnZillow=45))
        assert out["daysOnMarket"] == 45
        assert out["daysOnZillow"] == out["daysOnMarket"]

    def test_sqft_alias(self):
        out = normalize_listing(_make_raw(livingArea=2200))
        assert out["sqft"] == 2200
        assert out["sqft"] == out["livingArea"]

    def test_price_per_square_foot(self):
        out = normalize_listing(_make_raw(price=360000, livingArea=1800))
        assert out["pricePerSquareFoot"] == 200

    def test_price_per_square_foot_no_size(self):
        raw = _make_raw(price=360000)
        raw.pop("livingArea", None)
        out = normalize_listing(raw)
        assert out["pricePerSquareFoot"] is None


# ---- Coordinates ----


class TestNormalizerCoordinates:
    def test_lat_lon(self):
        out = normalize_listing(_make_raw())
        assert out["latitude"] == 33.749
        assert out["longitude"] == -84.388

    def test_missing_coordinates(self):
        out = normalize_listing(_make_raw(latitude=None, longitude=None))
        assert out["latitude"] is None
        assert out["longitude"] is None


# ---- Lot size ----


class TestNormalizerLotSize:
    def test_lot_from_rapidapi_fields(self):
        out = normalize_listing(_make_raw(lotAreaValue=10000, lotAreaUnit="sqft", lotAcres=0.23))
        assert out["lotAreaValue"] == 10000
        assert out["lotAreaUnit"] == "sqft"
        assert out["lotAcres"] == 0.23

    def test_lot_missing(self):
        raw = _make_raw()
        raw.pop("lotAreaValue", None)
        raw.pop("lotAcres", None)
        raw.pop("lotSize", None)
        out = normalize_listing(raw)
        assert out["lotAreaValue"] is None
        assert out["lotAcres"] is None


# ---- Images ----


class TestNormalizerImages:
    def test_img_src_and_images(self):
        out = normalize_listing(_make_raw(imgSrc="a.jpg", images=["a.jpg", "b.jpg"]))
        assert out["imgSrc"] == "a.jpg"
        assert out["images"] == ["a.jpg", "b.jpg"]

    def test_img_src_prepended_when_missing_from_list(self):
        out = normalize_listing(_make_raw(imgSrc="hero.jpg", images=["b.jpg"]))
        assert out["imgSrc"] == "hero.jpg"
        assert out["images"][0] == "hero.jpg"
        assert "b.jpg" in out["images"]

    def test_no_images(self):
        out = normalize_listing(_make_raw(imgSrc=None, images=[]))
        assert out["imgSrc"] is None
        assert out["images"] == []


# ---- Type / status / flags ----


class TestNormalizerTypeStatus:
    def test_property_type_and_home_type(self):
        out = normalize_listing(_make_raw(homeType="TOWNHOUSE", propertyType="Townhouse"))
        assert out["propertyType"] == "Townhouse"
        assert out["homeType"] == "TOWNHOUSE"

    def test_home_type_fills_property_type(self):
        out = normalize_listing(_make_raw(homeType="CONDO", propertyType=None))
        assert out["homeType"] == "CONDO"
        assert out["propertyType"] == "CONDO"

    def test_listing_status(self):
        assert normalize_listing(_make_raw(listingStatus="PENDING"))["listingStatus"] == "PENDING"

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
        results = normalize_listings([_make_raw(zpid="A"), _make_raw(zpid="B")])
        assert len(results) == 2
        assert results[0]["zpid"] == "A"
        assert results[1]["zpid"] == "B"

    def test_empty_batch(self):
        assert normalize_listings([]) == []


class TestNormalizerScoringFields:
    def test_normalized_row_includes_fields_used_by_mcda(self):
        out = normalize_listing(_make_raw())
        assert out.get("zpid") == "12345"
        assert out.get("price") == 350000
        assert out.get("bedrooms") == 3
        assert out.get("livingArea") == 1800

    def test_slim_response_preserves_score(self):
        row = normalize_listing(_make_raw())
        row["_score"] = 67.3
        slimmed = slim_properties_for_search_response([row])
        assert len(slimmed) == 1
        assert slimmed[0].get("score") == 67.3


# ---- Legacy Slipstream fallback ----


class TestLegacySlipstreamFallback:
    def test_legacy_slipstream_shape_still_maps(self):
        out = normalize_listing(
            {
                "id": "MLS-1",
                "address": {
                    "deliveryLine": "1 Oak",
                    "city": "Atlanta",
                    "state": "GA",
                    "zip": "30301",
                },
                "beds": 2,
                "baths": {"total": 1},
                "coordinates": {"latitude": 33.7, "longitude": -84.4},
                "listPrice": 200000,
                "size": 1000,
                "status": "Active",
            }
        )
        assert out["zpid"] == "MLS-1"
        assert out["bedrooms"] == 2
        assert out["bathrooms"] == 1
        assert out["price"] == 200000
        assert out["livingArea"] == 1000
        assert out["latitude"] == 33.7
        assert out["listingStatus"] == "Active"
        assert "1 Oak" in out["address"]
