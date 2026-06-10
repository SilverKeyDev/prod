"""Household income distribution data retrieval and processing."""

from logger import log

from .census_client import fetch_census_data_by_zip
from .constants import INCOME_KEYS
from .geocoding import get_zip_from_address


def get_income_distribution(address: str) -> dict:
    """Returns household income distribution for a given address.

    Args:
        address: Full address string

    Returns:
        dict: Income bracket labels mapped to percentage values, or error dict
    """
    try:
        log.info("API", "Starting Income Distribution Lookup", {"address": address})

        zip_code = get_zip_from_address(address)
        variable_keys = list(INCOME_KEYS.values())
        raw_data = fetch_census_data_by_zip(zip_code, variable_keys, table_type="subject")

        header = raw_data[0]
        row = raw_data[1]
        row_dict = dict(zip(header, row, strict=False))

        total_households = sum(float(row_dict.get(key, 0)) for key in INCOME_KEYS.values())

        income_distribution = {}
        for label, key in INCOME_KEYS.items():
            value = float(row_dict.get(key, 0))
            percentage = (value / total_households * 100) if total_households > 0 else 0
            income_distribution[label] = int(round(percentage))
            log.debug(
                "API",
                "Income percentage",
                {"bracket": label, "percentage": income_distribution[label]},
            )

        log.info("API", "Final Income Distribution", income_distribution)
        return income_distribution

    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to get income distribution",
            {"address": address, "error": str(e)},
        )
        return {"error": str(e), "address": address}
