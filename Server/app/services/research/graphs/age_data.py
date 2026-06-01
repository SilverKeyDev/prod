"""
DEPRECATED: This module has been reorganized into the demographics package.

This file is maintained for backwards compatibility only.
Please update imports to use:
    from app.services.research.graphs.demographics import (
        get_age_distribution,
        get_race_distribution,
        get_income_distribution,
        get_education_distribution,
        get_population_total,
    )
"""

# Re-export all public functions from the new demographics package
from .demographics import (
    get_age_distribution,
    get_education_distribution,
    get_income_distribution,
    get_population_total,
    get_race_distribution,
)

# Re-export utility functions for backwards compatibility
from .demographics.census_client import fetch_census_data_by_zip

# Re-export constants for backwards compatibility
from .demographics.constants import (
    AGE_GROUP_KEYS,
    CENSUS_API_KEY,
    EDUCATION_KEYS,
    GOOGLE_MAPS_API_KEY,
    INCOME_KEYS,
    RACE_KEYS,
)
from .demographics.geocoding import get_zip_from_address

__all__ = [
    # Public API functions
    "get_age_distribution",
    "get_race_distribution",
    "get_income_distribution",
    "get_education_distribution",
    "get_population_total",
    # Constants
    "AGE_GROUP_KEYS",
    "RACE_KEYS",
    "INCOME_KEYS",
    "EDUCATION_KEYS",
    "GOOGLE_MAPS_API_KEY",
    "CENSUS_API_KEY",
    # Utility functions
    "get_zip_from_address",
    "fetch_census_data_by_zip",
]
