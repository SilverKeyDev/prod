"""Normalize a raw Slipstream listing dict into the internal property shape.

Field names confirmed via live API responses (Phase 0 discovery).
The output dict matches what scoring, persistence, and client transforms expect.

Full Slipstream envelope for one home (``body`` from ``/ws/listings/get``): see
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``; live responses are
debug-logged from ``get_property_detail``.
"""

from __future__ import annotations

from logger import LOG_CATEGORIES, log


def _csv_to_list(val: str | list | None) -> list[str]:
    """Split a comma-separated string into a trimmed list. Pass-through lists."""
    if val is None:
        return []
    if isinstance(val, list):
        return [str(v).strip() for v in val if v]
    if isinstance(val, str):
        return [s.strip() for s in val.split(",") if s.strip()]
    return []


_SCHOOL_LEVEL_MAP = {
    "elementary": "Elementary School",
    "middle": "Middle School",
    "high": "High School",
}


def _normalize_schools(schools: dict | list | None) -> list[dict]:
    """Normalize Slipstream school data to a list of school dicts.

    Handles multiple formats returned by the Slipstream API:
    - dict-of-strings: ``{elementary: "Name", middle: "Name", high: "Name"}``
    - dict-of-objects: ``{elementary: {name, rating, distance, grades}, ...}``
    - flat dict with suffixed keys: ``{elementary: "Name", elementaryRating: 7, ...}``
    - list of school objects: passed through as-is
    """
    if isinstance(schools, list):
        return schools
    if not isinstance(schools, dict):
        return []

    log.debug(
        LOG_CATEGORIES["API"],
        "Raw Slipstream schools data",
        {"schools_keys": list(schools.keys()), "schools": schools},
    )

    result: list[dict] = []
    for key, label in _SCHOOL_LEVEL_MAP.items():
        entry = schools.get(key)
        if not entry:
            continue

        if isinstance(entry, dict):
            name = entry.get("name") or entry.get("schoolName") or ""
            if isinstance(name, str) and name.strip():
                school: dict = {"name": name.strip(), "level": label}
                rating = entry.get("rating") or entry.get("gsRating")
                if rating is not None:
                    school["rating"] = rating
                distance = entry.get("distance")
                if distance is not None:
                    school["distance"] = distance
                grades = entry.get("grades") or entry.get("gradeRange")
                if grades is not None:
                    school["grades"] = str(grades)
                school_type = entry.get("type") or entry.get("schoolType")
                if school_type and isinstance(school_type, str):
                    school["level"] = school_type
                result.append(school)
        elif isinstance(entry, str) and entry.strip():
            school = {"name": entry.strip(), "level": label}
            rating = schools.get(f"{key}Rating") or schools.get(f"{key}Score")
            if rating is not None:
                school["rating"] = rating
            distance = schools.get(f"{key}Distance")
            if distance is not None:
                school["distance"] = distance
            grades = schools.get(f"{key}Grades") or schools.get(f"{key}GradeRange")
            if grades is not None:
                school["grades"] = str(grades)
            result.append(school)
    return result


def normalize_listing(raw: dict) -> dict:
    """Map a single Slipstream listing to the internal property dict shape.

    Slipstream fields (confirmed from live API):
      id, address{deliveryLine, city, state, zip, street},
      beds, baths{total, full, half}, coordinates{latitude, longitude},
      listPrice, salePrice, size, lotSize{sqft, acres}, propertyType,
      listingType, status, imageCount, images[], yearBuilt, daysOnMarket,
      description, style, county, subdivision, schools{}, listingAgent{},
      listingOffice{}, newConstruction, associationFee
    """
    addr = raw.get("address") or {}
    coords = raw.get("coordinates") or {}
    baths_obj = raw.get("baths") or {}
    lot = raw.get("lotSize") or {}
    raw_images = raw.get("images") or []

    image_count = raw.get("imageCount")
    if (
        isinstance(image_count, int)
        and image_count > 1
        and raw_images
        and isinstance(raw_images[0], str)
    ):
        base_url = raw_images[0]
        stem = base_url.rsplit("/", 1)
        if len(stem) == 2 and "photo_" in stem[1]:
            prefix = stem[0]
            ext = stem[1].rsplit(".", 1)[-1] if "." in stem[1] else "jpg"
            images = [f"{prefix}/photo_{i}.{ext}" for i in range(1, image_count + 1)]
        else:
            images = list(raw_images)
    else:
        images = list(raw_images)

    street = addr.get("deliveryLine") or addr.get("street") or ""
    city = addr.get("city") or ""
    state = addr.get("state") or ""
    zipcode = addr.get("zip") or ""
    parts = [p for p in (street, city, f"{state} {zipcode}".strip()) if p]
    full_address = ", ".join(parts)

    living_area = raw.get("size")
    lot_sqft = lot.get("sqft") if isinstance(lot, dict) else lot
    lot_acres = lot.get("acres") if isinstance(lot, dict) else None
    days_on_market = raw.get("daysOnMarket")

    lot_size_str = ""
    if lot_sqft:
        lot_size_str = (
            f"{lot_sqft:,} sqft" if isinstance(lot_sqft, int | float) else f"{lot_sqft} sqft"
        )
    elif lot_acres:
        lot_size_str = f"{lot_acres} acres"

    price_val = raw.get("listPrice")
    price_per_sqft = None
    if (
        isinstance(price_val, int | float)
        and isinstance(living_area, int | float)
        and living_area > 0
    ):
        price_per_sqft = round(price_val / living_area)

    return {
        "zpid": raw.get("id"),
        "mls_home_id": raw.get("id"),
        "address": full_address,
        "streetAddress": street,
        "city": city,
        "state": state,
        "zipcode": zipcode,
        "bedrooms": raw.get("beds"),
        "bathrooms": baths_obj.get("total") if isinstance(baths_obj, dict) else baths_obj,
        "livingArea": living_area,
        "sqft": living_area,
        "price": price_val,
        "salePrice": raw.get("salePrice"),
        "latitude": coords.get("latitude"),
        "longitude": coords.get("longitude"),
        "imgSrc": images[0] if images else None,
        "propertyType": raw.get("propertyType"),
        "listingType": raw.get("listingType"),
        "listingStatus": raw.get("status"),
        "lotAreaValue": lot_sqft,
        "lotAreaUnit": "sqft",
        "lotAcres": lot_acres,
        "lotSize": lot_size_str or None,
        "yearBuilt": raw.get("yearBuilt"),
        "imageCount": raw.get("imageCount"),
        "homeType": raw.get("propertyType"),
        "daysOnMarket": days_on_market,
        "daysOnZillow": days_on_market,
        "pricePerSquareFoot": price_per_sqft,
        "description": raw.get("description"),
        "county": raw.get("county"),
        "subdivision": raw.get("subdivision"),
        "newConstruction": raw.get("newConstruction"),
        "style": raw.get("style"),
        "associationFee": raw.get("associationFee"),
        "images": images,
        "listingAgent": raw.get("listingAgent"),
        "listingOffice": raw.get("listingOffice"),
        "schools": _normalize_schools(raw.get("schools")),
        "floors": raw.get("floors"),
        "previousListPrice": raw.get("previousListPrice"),
        "priceChangeTimestamp": raw.get("priceChangeTimestamp"),
        "pool": _csv_to_list(raw.get("pool")),
        "roof": raw.get("roof"),
        "propertyCondition": raw.get("propertyCondition"),
        "interiorFeatures": _csv_to_list(raw.get("interiorFeatures")),
        "communityFeatures": _csv_to_list(raw.get("communityFeatures")),
        "cooling": _csv_to_list(raw.get("cooling")),
        "heating": _csv_to_list(raw.get("heating")),
        "parkingFeatures": _csv_to_list(raw.get("parkingFeatures")),
        "lotFeatures": _csv_to_list(raw.get("lotFeatures")),
        "constructionMaterials": _csv_to_list(raw.get("constructionMaterials")),
        "fireplaceFeatures": _csv_to_list(raw.get("fireplaceFeatures")),
        "fencing": raw.get("fencing"),
        "securityFeatures": _csv_to_list(raw.get("securityFeatures")),
    }


def normalize_listings(raw_listings: list[dict]) -> list[dict]:
    """Normalize a list of raw Slipstream listings."""
    return [normalize_listing(r) for r in raw_listings]


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
            LOG_CATEGORIES["POLYGON_SEARCH"],
            "search_response_listings_missing_map_coordinates",
            {
                "missing_count": len(missing_coords_ids),
                "total": len(slimmed),
                "sample_listing_ids": missing_coords_ids[:8],
            },
        )
    return slimmed
