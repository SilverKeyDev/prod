"""Demographics data retrieval package.

This package provides functions to fetch demographic data (age, race, income, education)
for addresses using Census Bureau and Google Maps APIs.

Public API:
    - get_age_distribution(address: str) -> dict
    - get_race_distribution(address: str) -> dict
    - get_income_distribution(address: str) -> dict
    - get_education_distribution(address: str) -> dict
    - get_population_total(address: str) -> dict
"""

from .age import get_age_distribution, get_population_total
from .education import get_education_distribution
from .income import get_income_distribution
from .race import get_race_distribution

__all__ = [
    "get_age_distribution",
    "get_race_distribution",
    "get_income_distribution",
    "get_education_distribution",
    "get_population_total",
]
