"""
MCDA orchestration: base score + weighted soft signals (0–1 each) * hard multiplier → 1–99 display.

When a preference dimension is unset, objective listing-quality signals still differentiate scores.
When preferences are set, contributions are amplified so matches spread more dramatically.
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
from .criteria.objective_quality import (
    objective_amenities_richness_normalized,
    objective_baths_normalized,
    objective_beds_normalized,
    objective_dom_freshness_normalized,
    objective_home_age_normalized,
    objective_lot_normalized,
    objective_price_value_normalized,
    objective_sqft_normalized,
    objective_walkability_normalized,
)
from .criteria.preference_activity import (
    count_active_preference_dimensions,
    has_amenities_preference,
    has_baths_preference,
    has_beds_preference,
    has_budget_preference,
    has_commute_preference,
    has_dom_preference,
    has_home_age_preference,
    has_housing_type_preference,
    has_lot_preference,
    has_sqft_preference,
    has_walkability_preference,
    normalize_preferences_for_mcda,
    preference_strength_multiplier,
)

# Single tuning surface — adjust weights and multipliers here only.
MCDA_CONFIG: dict[str, Any] = {
    "base_score": 52.5,
    "price_peak_ratio": 0.65,
    "beds_baths_diminishing_k": 0.45,
    # Fraction of each dimension's weight applied to objective fallback signals.
    "objective_weight_scale": 0.34,
    # When few preference dimensions are set, lean harder on objective listing signals.
    "objective_weight_scale_low_coverage": 0.62,
    "low_coverage_dimension_threshold": 1,
    # Extra multiplier on preference-driven dimensions (more prefs → wider spread).
    "preference_strength_per_dimension": 0.05,
    "preference_strength_max": 0.40,
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
    "output_display_min": 1.0,
    "output_display_max": 99.0,
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


def _dimension_contribution(
    *,
    base_weight: float,
    preference_active: bool,
    preference_signal: float,
    objective_signal: float,
    preference_strength: float,
    objective_scale: float,
) -> float:
    if preference_active:
        return _soft_contribution(base_weight * preference_strength, preference_signal)
    return _soft_contribution(base_weight * objective_scale, objective_signal)


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
    preferences = normalize_preferences_for_mcda(preferences)
    weights = cfg["soft_signal_weights"]
    k_bb = float(cfg.get("beds_baths_diminishing_k", 0.45))
    peak = float(cfg.get("price_peak_ratio", 0.65))
    obj_scale = float(cfg.get("objective_weight_scale", 0.34))
    low_cov_threshold = int(cfg.get("low_coverage_dimension_threshold", 1))
    n_pref_dims = count_active_preference_dimensions(preferences, status_type=status_type)
    if n_pref_dims <= low_cov_threshold:
        obj_scale = float(cfg.get("objective_weight_scale_low_coverage", 0.62))
    pref_strength = preference_strength_multiplier(
        preferences,
        status_type=status_type,
        per_dimension=float(cfg.get("preference_strength_per_dimension", 0.05)),
        max_boost=float(cfg.get("preference_strength_max", 0.40)),
    )

    raw_soft = float(cfg["base_score"])

    raw_soft += _dimension_contribution(
        base_weight=float(weights["price_fit"]),
        preference_active=has_budget_preference(preferences, status_type),
        preference_signal=soft_price_normalized(preferences, property_dict, status_type, peak),
        objective_signal=objective_price_value_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["beds"]),
        preference_active=has_beds_preference(preferences),
        preference_signal=soft_beds_normalized(preferences, property_dict, k_bb),
        objective_signal=objective_beds_normalized(property_dict, k=k_bb),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["baths"]),
        preference_active=has_baths_preference(preferences),
        preference_signal=soft_baths_normalized(preferences, property_dict, k_bb),
        objective_signal=objective_baths_normalized(property_dict, k=k_bb),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["sqft"]),
        preference_active=has_sqft_preference(preferences),
        preference_signal=soft_sqft_normalized(preferences, property_dict),
        objective_signal=objective_sqft_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )

    if has_commute_preference(preferences):
        raw_soft += _dimension_contribution(
            base_weight=float(weights["commute"]),
            preference_active=True,
            preference_signal=soft_commute_normalized(preferences, property_dict),
            objective_signal=0.5,
            preference_strength=pref_strength,
            objective_scale=obj_scale,
        )

    raw_soft += _dimension_contribution(
        base_weight=float(weights["amenities"]),
        preference_active=has_amenities_preference(preferences),
        preference_signal=soft_amenities_normalized(preferences, property_dict),
        objective_signal=objective_amenities_richness_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["lot_acres"]),
        preference_active=has_lot_preference(preferences),
        preference_signal=soft_lot_acres_normalized(preferences, property_dict),
        objective_signal=objective_lot_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["home_age"]),
        preference_active=has_home_age_preference(preferences),
        preference_signal=soft_home_age_normalized(preferences, property_dict),
        objective_signal=objective_home_age_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )
    raw_soft += _dimension_contribution(
        base_weight=float(weights["days_on_market"]),
        preference_active=has_dom_preference(preferences),
        preference_signal=soft_days_on_market_normalized(preferences, property_dict),
        objective_signal=objective_dom_freshness_normalized(property_dict),
        preference_strength=pref_strength,
        objective_scale=obj_scale,
    )

    walk_pref = has_walkability_preference(preferences)
    walk_obj = objective_walkability_normalized(property_dict)
    if walk_pref or walk_obj != 0.5:
        raw_soft += _dimension_contribution(
            base_weight=float(weights["walkability"]),
            preference_active=walk_pref,
            preference_signal=soft_walkability_normalized(preferences, property_dict),
            objective_signal=walk_obj,
            preference_strength=pref_strength,
            objective_scale=obj_scale,
        )

    if has_housing_type_preference(preferences):
        raw_soft += _dimension_contribution(
            base_weight=float(weights["listing_type_fit"]),
            preference_active=True,
            preference_signal=soft_listing_type_normalized(preferences, property_dict),
            objective_signal=0.5,
            preference_strength=pref_strength,
            objective_scale=obj_scale,
        )

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


def preference_coverage_count(preferences: dict[str, Any], *, status_type: str = "ForSale") -> int:
    """Public helper: how many MCDA preference dimensions are active (for logging / tests)."""
    return count_active_preference_dimensions(preferences, status_type=status_type)
