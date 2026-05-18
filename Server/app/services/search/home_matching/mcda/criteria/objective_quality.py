"""
Objective listing-quality soft signals (0–1) used when the user has not set a preference
for that dimension. Keeps scores differentiated without inventing personal taste.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from app.services.search.helpers.home_age_preference_filter import home_age_years_for_property

from .beds_baths import listing_baths_value, listing_beds_value
from .days_on_market import soft_days_on_market_normalized
from .lot_acres import soft_lot_acres_normalized
from .price import listing_price
from .sqft import listing_sqft
from .walkability_fit import soft_walkability_normalized


def _clamp01(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def _around_neutral(value: float, half_span: float) -> float:
    """Map value in ~[0,1] to [0.5 - half_span, 0.5 + half_span]."""
    return _clamp01(0.5 + half_span * (value * 2.0 - 1.0), 0.5 - half_span, 0.5 + half_span)


def objective_beds_normalized(property_dict: dict[str, Any], *, k: float = 0.38) -> float:
    """Slightly favors more bedrooms when user has no bed preference (diminishing)."""
    beds = listing_beds_value(property_dict)
    if beds is None or beds <= 0:
        return 0.5
    bonus = 1.0 - math.exp(-k * max(0.0, beds - 1.0))
    return _around_neutral(bonus, 0.16)


def objective_baths_normalized(property_dict: dict[str, Any], *, k: float = 0.42) -> float:
    baths = listing_baths_value(property_dict)
    if baths is None or baths <= 0:
        return 0.5
    bonus = 1.0 - math.exp(-k * max(0.0, baths - 1.0))
    return _around_neutral(bonus, 0.14)


def objective_sqft_normalized(property_dict: dict[str, Any]) -> float:
    """Larger living area scores slightly higher (log-scaled, capped swing)."""
    sq = listing_sqft(property_dict)
    if sq is None or sq <= 0:
        return 0.5
    # ~900 sqft → low, ~2200 mid, ~4000+ high
    log_ratio = math.log(max(sq, 400.0) / 900.0) / math.log(4000.0 / 900.0)
    t = _clamp01(log_ratio)
    return _around_neutral(t, 0.15)


def objective_price_value_normalized(property_dict: dict[str, Any]) -> float:
    """
    Lower price-per-sqft → slightly higher score (generic “value” without a budget band).
    """
    price = listing_price(property_dict)
    sq = listing_sqft(property_dict)
    if price is None or price <= 0:
        return 0.5
    if sq is None or sq <= 0:
        # Moderate absolute price heuristic when sqft missing
        if price < 250_000:
            return 0.56
        if price < 600_000:
            return 0.52
        if price < 1_200_000:
            return 0.48
        return 0.42

    ppsf = price / sq
    ref_lo, ref_hi = 75.0, 380.0
    log_t = (math.log(max(ppsf, 50.0)) - math.log(ref_lo)) / (math.log(ref_hi) - math.log(ref_lo))
    # Cheaper $/sqft → higher signal
    return _around_neutral(1.0 - _clamp01(log_t), 0.14)


def objective_dom_freshness_normalized(property_dict: dict[str, Any]) -> float:
    """Fresher listings (lower DOM) score slightly higher when user has no DOM band."""
    return soft_days_on_market_normalized(
        {"days_on_market_min": 0, "days_on_market_max": 45},
        property_dict,
    )


def objective_home_age_normalized(property_dict: dict[str, Any]) -> float:
    """Newer homes score slightly higher when user has no age band."""
    cy = datetime.now(tz=timezone.utc).year
    age_y = home_age_years_for_property(property_dict, cy)
    if age_y is None:
        return 0.5
    # 0–5 yrs → high, 40+ → low (gentle)
    t = _clamp01(1.0 - age_y / 55.0)
    return _around_neutral(t, 0.12)


def objective_lot_normalized(property_dict: dict[str, Any]) -> float:
    """Moderate lot size scores slightly higher when user has no lot band."""
    return soft_lot_acres_normalized(
        {"preferred_lot_size_min": 0.15, "preferred_lot_size_max": 1.25},
        property_dict,
    )


def objective_walkability_normalized(property_dict: dict[str, Any]) -> float:
    """Use on-listing walk score when user has not set walkability importance."""
    return soft_walkability_normalized(
        {"walkability_importance": "somewhat_important"},
        property_dict,
    )


def objective_amenities_richness_normalized(property_dict: dict[str, Any]) -> float:
    """
    Listings with more documented features score slightly higher (not user-specific).
    """
    features = property_dict.get("features")
    count = 0
    if isinstance(features, dict):
        count = sum(1 for v in features.values() if v not in (None, "", [], {}))
    elif isinstance(features, list):
        count = len(features)
    desc = property_dict.get("description") or property_dict.get("remarks") or ""
    if isinstance(desc, str) and len(desc) > 400:
        count += 2
    elif isinstance(desc, str) and len(desc) > 120:
        count += 1
    if count <= 0:
        return 0.46
    if count >= 6:
        return 0.58
    return 0.46 + 0.12 * min(1.0, count / 6.0)
