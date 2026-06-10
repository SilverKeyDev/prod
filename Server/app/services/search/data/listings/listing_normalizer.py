"""Normalize raw Slipstream listing dicts into the internal property shape."""

from __future__ import annotations

from logger import log


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
        "API",
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
