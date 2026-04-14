"""
MCDA orchestration: base score + weighted soft signals (0–1 each) * hard multiplier → 15–90 display.
"""

from __future__ import annotations

from typing import Any

from .criteria import (
    hard_constraint_multiplier,
    soft_amenities_normalized,
    soft_baths_normalized,
    soft_beds_normalized,
    soft_commute_normalized,
    soft_days_on_market_normalized,
    soft_home_age_normalized,
    soft_listing_type_normalized,
    soft_lot_acres_normalized,
    soft_price_normalized,
    soft_sqft_normalized,
    soft_walkability_normalized,
)

# Single tuning surface — adjust weights and multipliers here only.
# Added housing-range signals (lot, age, DOM, walkability, listing_type): trimmed price/amenities slightly.
MCDA_CONFIG: dict[str, Any] = {
    # Slightly above neutral so typical listings land higher; soft signals still differentiate.
    "base_score": 52.5,
    "price_peak_ratio": 0.65,
    "beds_baths_diminishing_k": 0.45,
    "soft_signal_weights": {
        "price_fit": 15.0,
        "beds": 7.5,
        "baths": 7.5,
        "sqft": 6.0,
        "commute": 10.0,
        "amenities": 9.0,
        "lot_acres": 2.0,
        "home_age": 2.0,
        "days_on_market": 1.5,
        "walkability": 2.0,
        "listing_type_fit": 1.0,
    },
    "hard_multipliers": {
        # Moderate misses: a bit more forgiving; severe / wrong-type / extreme over-budget: harsher.
        "over_budget_moderate": 0.63,
        "over_budget_severe": 0.38,
        "over_budget_extreme": 0.26,
        "below_min_beds": 0.42,
        "below_min_baths": 0.42,
        "above_max_beds": 0.42,
        "above_max_baths": 0.42,
        "wrong_property_type": 0.40,
        "below_min_sqft": 0.55,
        "above_max_sqft": 0.58,
        "multiplier_floor": 0.15,
    },
    "output_display_min": 15.0,
    "output_display_max": 90.0,
    # Share of *display* score from embedding when enabled; capped so ≥99% stays MCDA (see cap below).
    "embedding_blend_weight": 0.0,
    "embedding_blend_weight_cap": 0.01,
}


def _soft_contribution(weight: float, signal_01: float) -> float:
    """
    Neutral at 0.5; maps [0,1] toward [-weight, +weight].
    Penalties are slightly damped vs rewards so more listings cluster in a higher band; hard
    multipliers still enforce strong drops for serious constraint violations.
    """
    centered = (signal_01 - 0.5) * 2.0
    if centered < 0:
        damped = centered * 0.88
    else:
        damped = centered * 1.04
    return weight * max(-1.0, min(1.0, damped))


def score_listing_mcda(
    preferences: dict[str, Any],
    property_dict: dict[str, Any],
    *,
    status_type: str = "ForSale",
    config: dict[str, Any] | None = None,
) -> float:
    """
    Deterministic match score in [output_display_min, output_display_max], one decimal.
    """
    cfg = MCDA_CONFIG if config is None else {**MCDA_CONFIG, **config}
    weights = cfg["soft_signal_weights"]
    k_bb = float(cfg.get("beds_baths_diminishing_k", 0.45))
    peak = float(cfg.get("price_peak_ratio", 0.65))

    s_price = soft_price_normalized(preferences, property_dict, status_type, peak)
    s_beds = soft_beds_normalized(preferences, property_dict, k_bb)
    s_baths = soft_baths_normalized(preferences, property_dict, k_bb)
    s_sqft = soft_sqft_normalized(preferences, property_dict)
    s_commute = soft_commute_normalized(preferences, property_dict)
    s_amenities = soft_amenities_normalized(preferences, property_dict)
    s_lot = soft_lot_acres_normalized(preferences, property_dict)
    s_age = soft_home_age_normalized(preferences, property_dict)
    s_dom = soft_days_on_market_normalized(preferences, property_dict)
    s_walk = soft_walkability_normalized(preferences, property_dict)
    s_listing = soft_listing_type_normalized(preferences, property_dict)

    raw_soft = float(cfg["base_score"])
    raw_soft += _soft_contribution(float(weights["price_fit"]), s_price)
    raw_soft += _soft_contribution(float(weights["beds"]), s_beds)
    raw_soft += _soft_contribution(float(weights["baths"]), s_baths)
    raw_soft += _soft_contribution(float(weights["sqft"]), s_sqft)
    raw_soft += _soft_contribution(float(weights["commute"]), s_commute)
    raw_soft += _soft_contribution(float(weights["amenities"]), s_amenities)
    raw_soft += _soft_contribution(float(weights["lot_acres"]), s_lot)
    raw_soft += _soft_contribution(float(weights["home_age"]), s_age)
    raw_soft += _soft_contribution(float(weights["days_on_market"]), s_dom)
    raw_soft += _soft_contribution(float(weights["walkability"]), s_walk)
    raw_soft += _soft_contribution(float(weights["listing_type_fit"]), s_listing)

    raw_soft = max(0.0, min(100.0, raw_soft))

    hard = hard_constraint_multiplier(
        preferences,
        property_dict,
        status_type,
        cfg["hard_multipliers"],
    )
    final_100 = max(0.0, min(100.0, raw_soft * hard))

    out_lo = float(cfg["output_display_min"])
    out_hi = float(cfg["output_display_max"])
    display = out_lo + (final_100 / 100.0) * (out_hi - out_lo)
    return round(display, 1)


def get_mcda_config() -> dict[str, Any]:
    """Return a shallow copy of the default config (for tests / callers)."""
    return dict(MCDA_CONFIG)
