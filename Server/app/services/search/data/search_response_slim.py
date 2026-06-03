"""Slim internal listing rows to OpenAPI search response shapes."""

from __future__ import annotations

from logger import log

_SEARCH_RESPONSE_KEYS = frozenset(
    {
        "zpid",
        "mls_home_id",
        "address",
        "streetAddress",
        "city",
        "state",
        "zipcode",
        "bedrooms",
        "bathrooms",
        "price",
        "livingArea",
        "sqft",
        "lotAreaValue",
        "lotAreaUnit",
        "lotSize",
        "latitude",
        "longitude",
        "imgSrc",
        "propertyType",
        "listingType",
        "listingStatus",
        "homeType",
        "imageCount",
        "_score",
        "yearBuilt",
        "daysOnMarket",
        "pricePerSquareFoot",
    }
)

_MAX_SEARCH_IMAGES = 5

_LISTING_STATUS_TO_OPENAPI: dict[str, str] = {
    "ACTIVE": "ACTIVE",
    "FOR SALE": "FOR_SALE",
    "FOR_SALE": "FOR_SALE",
    "PENDING": "PENDING",
    "SOLD": "SOLD",
    "OFF MARKET": "OFF_MARKET",
    "OFF_MARKET": "OFF_MARKET",
    "COMING SOON": "COMING_SOON",
    "COMING_SOON": "COMING_SOON",
    "CONTINGENT": "CONTINGENT",
    "UNDER CONTRACT": "CONTINGENT",
    "PRICE CHANGE": "ACTIVE",
}


def _str_listing_id(prop: dict) -> str:
    z = prop.get("zpid")
    if z is not None and str(z).strip():
        return str(z)
    m = prop.get("mls_home_id")
    if m is not None and str(m).strip():
        return str(m)
    return ""


def _bedrooms_int(prop: dict) -> int:
    v = prop.get("bedrooms")
    if v is None:
        return 0
    try:
        return max(0, int(v))
    except (TypeError, ValueError):
        return 0


def _bathrooms_float(prop: dict) -> float:
    v = prop.get("bathrooms")
    if v is None:
        return 0.0
    try:
        return max(0.0, float(v))
    except (TypeError, ValueError):
        return 0.0


def _living_area_sqft_optional(prop: dict) -> int | None:
    for key in ("livingArea", "sqft"):
        v = prop.get(key)
        if v is None:
            continue
        try:
            if isinstance(v, str):
                v = int(float(v.replace(",", "")))
            return int(v)
        except (TypeError, ValueError):
            continue
    return None


def _year_built_optional(prop: dict) -> int | None:
    v = prop.get("yearBuilt")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _days_on_market_optional(prop: dict) -> int | None:
    v = prop.get("daysOnMarket")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _openapi_listing_status(raw: object) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    key = s.upper()
    if key in _LISTING_STATUS_TO_OPENAPI:
        return _LISTING_STATUS_TO_OPENAPI[key]
    norm = key.replace(" ", "_")
    if norm in (
        "FOR_SALE",
        "PENDING",
        "SOLD",
        "OFF_MARKET",
        "COMING_SOON",
        "CONTINGENT",
        "ACTIVE",
    ):
        return norm
    return None


def _primary_image_url(prop: dict) -> str | None:
    url = prop.get("imgSrc")
    if isinstance(url, str):
        t = url.strip()
        if t.startswith(("http://", "https://")):
            return t
    return None


def _float_price_optional(prop: dict) -> float | None:
    v = prop.get("price")
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _float_ppsf_optional(prop: dict) -> float | None:
    v = prop.get("pricePerSquareFoot")
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _score_optional(prop: dict) -> float | None:
    v = prop.get("_score")
    if v is None:
        v = prop.get("score")
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def flat_slim_row_to_openapi_property_search_result(slim: dict) -> dict:
    """Convert internal slim/flat listing row to OpenAPI ``PropertySearchResult`` shape (nested)."""
    lid = _str_listing_id(slim)
    address = str(slim.get("address") or "")
    city = str(slim.get("city") or "")
    state = str(slim.get("state") or "")
    zipcode = str(slim.get("zipcode") or "")
    lat = slim.get("latitude")
    lng = slim.get("longitude")
    try:
        lat_f = float(lat) if lat is not None else None
    except (TypeError, ValueError):
        lat_f = None
    try:
        lng_f = float(lng) if lng is not None else None
    except (TypeError, ValueError):
        lng_f = None

    result: dict = {
        "id": lid,
        "essentials": {
            "bedrooms": _bedrooms_int(slim),
            "bathrooms": _bathrooms_float(slim),
            "livingAreaSqft": _living_area_sqft_optional(slim),
            "yearBuilt": _year_built_optional(slim),
        },
        "location": {
            "address": address,
            "city": city,
            "state": state,
            "zipcode": zipcode,
            "latitude": lat_f,
            "longitude": lng_f,
        },
    }

    price = _float_price_optional(slim)
    ppsf = _float_ppsf_optional(slim)
    if price is not None or ppsf is not None:
        result["financials"] = {"price": price, "pricePerSqft": ppsf}

    img = _primary_image_url(slim)
    if img is not None:
        result["media"] = {"primaryImageUrl": img}

    meta_status = _openapi_listing_status(slim.get("listingStatus"))
    home_type = slim.get("homeType")
    dom = _days_on_market_optional(slim)
    if meta_status is not None or home_type is not None or dom is not None:
        result["metadata"] = {
            "listingStatus": meta_status,
            "homeType": str(home_type) if home_type is not None else None,
            "daysOnMarket": dom,
        }

    score = _score_optional(slim)
    if score is not None:
        result["score"] = score

    return result


def slim_property_for_search_response(prop: dict) -> dict:
    """Return a lightweight OpenAPI-shaped ``PropertySearchResult`` dict.

    Heavy fields (description, schools, agents, raw_data overflow) are stripped.
    Images are capped at ``_MAX_SEARCH_IMAGES``.
    """
    slim_flat: dict = {k: v for k, v in prop.items() if k in _SEARCH_RESPONSE_KEYS}

    images = prop.get("images")
    if images and isinstance(images, list):
        slim_flat["images"] = images[:_MAX_SEARCH_IMAGES]

    return flat_slim_row_to_openapi_property_search_result(slim_flat)


def _listing_id_for_search_log_openapi(row: dict) -> str:
    lid = row.get("id")
    if isinstance(lid, str) and lid.strip():
        return lid
    return "unknown"


def _coords_missing_for_map(lat: object, lng: object) -> bool:
    """True when listing lat/lng are absent or unusable for map pins (matches client getListingCoords)."""
    if lat is None or lng is None:
        return True
    try:
        a, b = float(lat), float(lng)
    except (TypeError, ValueError):
        return True
    if a != a or b != b:  # NaN
        return True
    return a == 0.0 and b == 0.0


def slim_properties_for_search_response(properties: list[dict]) -> list[dict]:
    """Slim a list of properties for the search response payload."""
    slimmed: list[dict] = []
    missing_coords_ids: list[str] = []
    for p in properties:
        sp = slim_property_for_search_response(p)
        slimmed.append(sp)
        loc = sp.get("location")
        lat = lng = None
        if isinstance(loc, dict):
            lat, lng = loc.get("latitude"), loc.get("longitude")
        if _coords_missing_for_map(lat, lng):
            missing_coords_ids.append(_listing_id_for_search_log_openapi(sp))

    if missing_coords_ids:
        log.info(
            "POLYGON_SEARCH",
            "search_response_listings_missing_map_coordinates",
            {
                "missing_count": len(missing_coords_ids),
                "total": len(slimmed),
                "sample_listing_ids": missing_coords_ids[:8],
            },
        )
    return slimmed
