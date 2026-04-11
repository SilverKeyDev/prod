"""
Extract categorized property features from property listing JSON data.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Any


def extract_property_features(listing: dict[str, Any]) -> dict[str, list[str]]:
    """
    Extract categorized property features from a property listing JSON.

    Args:
        listing: Property listing dict with resoFacts and other fields

    Returns:
        Dict mapping category names to lists of feature strings
    """
    rf: dict[str, Any] = (listing.get("resoFacts") or {}) if isinstance(listing, dict) else {}

    # Slipstream listings carry feature fields at the top level (no resoFacts).
    # Build a merged view so the extraction logic below works for both formats.
    if not rf and isinstance(listing, dict):
        _SLIPSTREAM_FEATURE_KEYS = [
            "interiorFeatures",
            "communityFeatures",
            "cooling",
            "heating",
            "parkingFeatures",
            "lotFeatures",
            "constructionMaterials",
            "fireplaceFeatures",
            "securityFeatures",
            "fencing",
            "pool",
            "roof",
        ]
        for k in _SLIPSTREAM_FEATURE_KEYS:
            val = listing.get(k)
            if val is not None:
                if isinstance(val, str):
                    rf[k] = [s.strip() for s in val.split(",") if s.strip()]
                elif isinstance(val, list):
                    rf[k] = val
                else:
                    rf[k] = val

    # Categorized features
    categories = {
        "Architectural Style": [],
        "Interior Features": [],
        "Exterior Features": [],
        "Systems & Utilities": [],
        "Rooms & Spaces": [],
        "Parking & Storage": [],
        "Outdoor Living": [],
        "Green & Efficiency": [],
        "Community Features": [],
    }

    def add_to_category(category: str, raw: str | None) -> None:
        v = str(raw or "").strip()
        if not v:
            return
        pretty = _prettify(v)
        if pretty not in categories[category]:
            categories[category].append(pretty)

    def add_each_to_category(category: str, vals: Iterable[Any] | None, transform=None) -> None:
        if not vals:
            return
        for val in vals:
            if val is None:
                continue
            s = str(val)
            processed = transform(s) if transform else s
            add_to_category(category, processed)

    # ---------- Description keyword mining ----------
    desc = str(listing.get("description") or "").lower()
    desc_hits: list[tuple[re.Pattern, str, str]] = [
        (re.compile(r"\bmid[-\s]?century\b"), "Mid-century modern", "Architectural Style"),
        (re.compile(r"\bopen[-\s]?concept\b"), "Open-concept layout", "Interior Features"),
        (
            re.compile(r"\bscreened[ -]?in\b.*\b(patio|porch)\b"),
            "Screened porch/patio",
            "Outdoor Living",
        ),
        (re.compile(r"\bcovered\b.*\b(patio|porch)\b"), "Covered patio", "Outdoor Living"),
        (re.compile(r"\bfront porch\b"), "Front porch", "Outdoor Living"),
        (re.compile(r"\b(private|large)\s+back(yard)?\b"), "Private backyard", "Outdoor Living"),
        (re.compile(r"\bnew\b.*\bhvac\b"), "New HVAC", "Systems & Utilities"),
        (re.compile(r"\byoung\b.*\broof\b|\bnew(er)?\s+roof\b"), "Newer roof", "Exterior Features"),
        (re.compile(r"\bhot water heater\b"), "Newer water heater", "Systems & Utilities"),
        (re.compile(r"\bbeam(ed)? ceilings?\b"), "Beamed ceilings", "Interior Features"),
    ]
    for rx, feat, cat in desc_hits:
        if rx.search(desc):
            add_to_category(cat, feat)

    # ---------- Property "phrases" from homeInsights ----------
    try:
        insights = listing.get("homeInsights") or []
        phrases = []
        if insights and isinstance(insights, list):
            for block in insights:
                items = (block or {}).get("insights") or []
                for it in items:
                    phrases.extend((it or {}).get("phrases") or [])
        for phrase in phrases:
            clean_phrase = _keep_nice(phrase)
            # Categorize phrases based on content
            if any(
                word in clean_phrase.lower()
                for word in ["kitchen", "bathroom", "bedroom", "living", "dining", "family room"]
            ):
                add_to_category("Rooms & Spaces", clean_phrase)
            elif any(
                word in clean_phrase.lower()
                for word in ["heating", "cooling", "hvac", "plumbing", "electrical"]
            ):
                add_to_category("Systems & Utilities", clean_phrase)
            elif any(
                word in clean_phrase.lower()
                for word in ["patio", "deck", "yard", "garden", "outdoor"]
            ):
                add_to_category("Outdoor Living", clean_phrase)
            else:
                add_to_category("Interior Features", clean_phrase)
    except Exception:
        pass

    # ---------- Core RESO facts ----------
    add_to_category("Architectural Style", rf.get("architecturalStyle"))

    # Materials → "... exterior"
    add_each_to_category(
        "Exterior Features", rf.get("constructionMaterials"), lambda m: f"{_keep_nice(m)} exterior"
    )

    # Interior
    add_each_to_category("Interior Features", rf.get("interiorFeatures"), _keep_nice)
    add_each_to_category(
        "Interior Features", rf.get("flooring"), lambda f: f"{_keep_nice(f)} floors"
    )

    # Fireplaces
    add_each_to_category("Interior Features", rf.get("fireplaceFeatures"), _keep_nice)
    _fp = rf.get("fireplaces")
    if _fp is not None and _is_num(_fp) and float(_fp) > 0:
        n = int(float(_fp))
        add_to_category("Interior Features", "1 fireplace" if n == 1 else f"{n} fireplaces")

    # Basement (can be comma-separated string)
    b = rf.get("basement")
    if b:
        parts = [p.strip() for p in str(b).split("/") for p in p.split(",")]
        for part in filter(None, parts):
            if re.search(r"crawl", part, re.I):
                add_to_category("Interior Features", "Crawl space")
            else:
                add_to_category("Interior Features", f"Basement: {_keep_nice(part)}")

    # Laundry
    add_each_to_category(
        "Interior Features", rf.get("laundryFeatures"), lambda x: f"Laundry: {_keep_nice(x)}"
    )

    # Patio / Porch normalization
    pp = [_keep_nice(x) for x in (rf.get("patioAndPorchFeatures") or [])]
    if pp:
        has_porch = any(re.search(r"porch", x, re.I) for x in pp)
        is_screened = any(re.search(r"screened", x, re.I) for x in pp)
        if has_porch and is_screened:
            add_to_category("Outdoor Living", "Screened porch")
            # also add any other distinct patio/porch items
            for x in pp:
                if not re.search(r"screened|porch", x, re.I):
                    add_to_category("Outdoor Living", x)
        else:
            for feature in pp:
                add_to_category("Outdoor Living", _keep_nice(feature))

    # Lot / exterior
    add_each_to_category("Outdoor Living", rf.get("lotFeatures"), _keep_nice)
    fenc = rf.get("fencing")
    if fenc:
        fenc_s = str(fenc)
        add_to_category(
            "Outdoor Living",
            "Fenced back yard"
            if re.search(r"back", fenc_s, re.I)
            else f"Fencing: {_keep_nice(fenc_s)}",
        )

    if rf.get("roofType"):
        add_to_category("Exterior Features", f"{_keep_nice(rf['roofType'])} roof")

    view = rf.get("view")
    if isinstance(view, list) and view:
        add_each_to_category("Outdoor Living", view, lambda v: f"{_keep_nice(v)} view")
    elif rf.get("hasView"):
        add_to_category("Outdoor Living", "View")

    # Water adjacency / view
    if listing.get("waterView") is True or (rf.get("waterViewYN") is True):
        add_to_category("Outdoor Living", "Water view")
    if rf.get("waterfrontFeatures"):
        add_to_category("Outdoor Living", f"Waterfront: {_keep_nice(rf['waterfrontFeatures'])}")

    # Systems
    add_each_to_category(
        "Systems & Utilities", rf.get("heating"), lambda h: _normalize_hvac(h, "heat")
    )
    add_each_to_category(
        "Systems & Utilities", rf.get("cooling"), lambda c: _normalize_hvac(c, "cool")
    )
    add_each_to_category(
        "Systems & Utilities", rf.get("sewer"), lambda s: _normalize_sewer_water(s, "sewer")
    )
    add_each_to_category(
        "Systems & Utilities", rf.get("waterSource"), lambda w: _normalize_sewer_water(w, "water")
    )

    # Rooms & features
    add_each_to_category("Rooms & Spaces", rf.get("roomTypes"), _keep_nice)
    rooms = rf.get("rooms")
    if isinstance(rooms, list):
        for r in rooms:
            if not isinstance(r, dict):
                continue
            if r.get("roomType"):
                add_to_category("Rooms & Spaces", _keep_nice(r["roomType"]))
            add_each_to_category("Rooms & Spaces", r.get("roomFeatures"), _keep_nice)
            if r.get("roomDescription"):
                add_to_category("Rooms & Spaces", _keep_nice(r["roomDescription"]))

    # Appliances
    add_each_to_category("Interior Features", rf.get("appliances"), _keep_nice)

    # Parking
    add_each_to_category("Parking & Storage", rf.get("parkingFeatures"), _keep_nice)
    _pc = rf.get("parkingCapacity")
    if _pc is not None and _is_num(_pc) and float(_pc) > 0:
        n = int(float(_pc))
        add_to_category(
            "Parking & Storage", "Parking (1 space)" if n == 1 else f"Parking ({n} spaces)"
        )

    if (rf.get("garageParkingCapacity") or 0) > 0:
        add_to_category("Parking & Storage", "Garage")
    if (rf.get("carportParkingCapacity") or 0) > 0:
        add_to_category("Parking & Storage", "Carport")
    if (rf.get("coveredParkingCapacity") or 0) > 0:
        add_to_category("Parking & Storage", "Covered parking")
    if (rf.get("openParkingCapacity") or 0) > 0 or rf.get("hasOpenParking"):
        add_to_category("Parking & Storage", "Open parking")
    if rf.get("hasAttachedGarage"):
        add_to_category("Parking & Storage", "Attached garage")

    # Boolean toggles (fallbacks)
    if rf.get("hasCooling"):
        add_to_category("Systems & Utilities", "Has cooling")
    if rf.get("hasHeating"):
        add_to_category("Systems & Utilities", "Has heating")
    if rf.get("hasFireplace"):
        add_to_category("Interior Features", "Fireplace")
    if rf.get("hasHomeWarranty"):
        add_to_category("Interior Features", "Home warranty")

    # Community / HOA
    add_each_to_category("Community Features", rf.get("communityFeatures"), _keep_nice)

    # Green / accessibility / security
    add_each_to_category("Green & Efficiency", rf.get("greenEnergyEfficient"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenEnergyGeneration"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenIndoorAirQuality"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenSustainability"), _keep_nice)
    add_each_to_category("Green & Efficiency", rf.get("greenWaterConservation"), _keep_nice)
    add_each_to_category("Interior Features", rf.get("accessibilityFeatures"), _keep_nice)
    add_each_to_category("Interior Features", rf.get("securityFeatures"), _keep_nice)

    # Property subtype / structure / type
    add_each_to_category("Architectural Style", rf.get("propertySubType"), _keep_nice)
    if listing.get("homeType"):
        add_to_category("Architectural Style", _keep_nice(listing["homeType"]))
    if listing.get("propertyTypeDimension"):
        add_to_category("Architectural Style", _keep_nice(listing["propertyTypeDimension"]))
    if rf.get("structureType"):
        add_to_category("Architectural Style", _keep_nice(rf["structureType"]))

    # Sort features within each category and remove empty categories
    sorted_categories = {}
    for category, feature_list in categories.items():
        if feature_list:
            sorted_categories[category] = sorted(set(feature_list))  # Remove duplicates and sort

    return sorted_categories


# ----------------------------- Helper Functions -----------------------------


def _prettify(s: str) -> str:
    """Format a string to title case with special handling for acronyms."""
    s = re.sub(r"_+", " ", s.strip())
    tokens = s.split()
    out: list[str] = []
    for t in tokens:
        if re.fullmatch(r"(hvac|ac|a/c|usb|led|ev|hoa)", t, re.I):
            out.append(t.upper())
        elif len(t) <= 3:
            out.append(t[:1].upper() + t[1:].lower())
        else:
            out.append(t[:1].upper() + t[1:])
    pretty = " ".join(out)
    pretty = re.sub(r"\bAnd\b", "and", pretty)
    pretty = re.sub(r"\bOn\b", "on", pretty)
    pretty = re.sub(r"\bOf\b", "of", pretty)
    return pretty


def _keep_nice(s: str) -> str:
    """Clean and prettify a string."""
    return _prettify(re.sub(r"\s{2,}", " ", str(s)).strip())


def _is_num(x: Any) -> bool:
    """Check if a value is numeric."""
    if isinstance(x, int | float):
        return True
    if isinstance(x, str) and x.strip():
        try:
            float(x)
            return True
        except ValueError:
            return False
    return False


def _normalize_hvac(val: str, kind: str) -> str:
    """Normalize HVAC-related strings."""
    v = str(val).lower().strip()
    if kind == "cool":
        if re.search(r"\bcentral\b", v):
            return "Central air"
        if re.search(r"\bceiling fan", v):
            return "Ceiling fans"
        if re.search(r"\bwall\b|\bwindow\b", v):
            return "Wall/window AC"
        return _keep_nice(val)
    # heat
    if re.search(r"\bforced air\b", v):
        return "Forced air heat"
    if re.search(r"\bnatural gas\b", v):
        return "Natural gas heat"
    if re.search(r"\bheat pump\b", v):
        return "Heat pump"
    if re.search(r"\bradiant\b", v):
        return "Radiant heat"
    if re.search(r"\bbaseboard\b", v):
        return "Baseboard heat"
    return _keep_nice(val)


def _normalize_sewer_water(s: str, kind: str) -> str:
    """Normalize sewer/water-related strings."""
    t = s.lower()
    if kind == "sewer":
        return _keep_nice(s) if "sewer" in t else f"{_keep_nice(s)} sewer"
    return _keep_nice(s) if "water" in t else f"{_keep_nice(s)} water"
