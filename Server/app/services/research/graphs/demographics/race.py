"""Race and ethnicity distribution data retrieval and processing."""

from logger import log

from .census_client import fetch_census_data_by_zip
from .constants import RACE_KEYS
from .geocoding import get_zip_from_address


def get_race_distribution(address: str) -> dict:
    """Returns race/ethnicity distribution for a given address.

    Args:
        address: Full address string

    Returns:
        dict: Race/ethnicity labels mapped to percentage values, or error dict
    """
    try:
        log.info("API", "Starting Race Distribution Lookup", {"address": address})

        zip_code = get_zip_from_address(address)
        variable_keys = list(RACE_KEYS.values())
        raw_data = fetch_census_data_by_zip(zip_code, variable_keys, table_type="profile")

        header = raw_data[0]
        row = raw_data[1]
        row_dict = dict(zip(header, row, strict=False))

        race_distribution = {}
        for label, key in RACE_KEYS.items():
            value = float(row_dict.get(key, 0))
            race_distribution[label] = int(round(value))
            log.debug(
                "API",
                "Race percentage",
                {"group": label, "percentage": race_distribution[label]},
            )

        log.info("API", "Final Race Distribution", race_distribution)
        return race_distribution

    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to get race distribution",
            {"address": address, "error": str(e)},
        )
        return {"error": str(e), "address": address}
