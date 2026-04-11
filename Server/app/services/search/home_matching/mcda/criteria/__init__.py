"""MCDA per-criterion scoring (0–1 soft signals and hard multipliers)."""

from .amenities import soft_amenities_normalized
from .beds_baths import soft_baths_normalized, soft_beds_normalized
from .commute import soft_commute_normalized
from .days_on_market import soft_days_on_market_normalized
from .hard_constraints import hard_constraint_multiplier
from .home_age_band import soft_home_age_normalized
from .listing_type_fit import soft_listing_type_normalized
from .lot_acres import soft_lot_acres_normalized
from .price import effective_budget_bounds, soft_price_normalized
from .property_type import listing_matches_preferred_housing_type, normalize_listing_type_key
from .sqft import soft_sqft_normalized
from .walkability_fit import soft_walkability_normalized

__all__ = [
    "effective_budget_bounds",
    "hard_constraint_multiplier",
    "listing_matches_preferred_housing_type",
    "normalize_listing_type_key",
    "soft_amenities_normalized",
    "soft_baths_normalized",
    "soft_beds_normalized",
    "soft_commute_normalized",
    "soft_days_on_market_normalized",
    "soft_home_age_normalized",
    "soft_listing_type_normalized",
    "soft_lot_acres_normalized",
    "soft_price_normalized",
    "soft_sqft_normalized",
    "soft_walkability_normalized",
]
