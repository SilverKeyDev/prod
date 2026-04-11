"""Educational attainment distribution data retrieval and processing."""

from logger import LOG_CATEGORIES, log

from .census_client import fetch_census_data_by_zip
from .constants import EDUCATION_KEYS
from .geocoding import get_zip_from_address


def get_education_distribution(address: str) -> dict:
    """Returns educational attainment distribution for a given address.

    Args:
        address: Full address string

    Returns:
        dict: Education level labels mapped to percentage values, or error dict
    """
    try:
        log.info(
            LOG_CATEGORIES["API"], "Starting Education Distribution Lookup", {"address": address}
        )

        zip_code = get_zip_from_address(address)
        variable_keys = list(EDUCATION_KEYS.values())
        raw_data = fetch_census_data_by_zip(zip_code, variable_keys, table_type="subject")

        header = raw_data[0]
        row = raw_data[1]
        row_dict = dict(zip(header, row, strict=False))

        total_population = sum(float(row_dict.get(key, 0)) for key in EDUCATION_KEYS.values())

        education_distribution = {}
        for label, key in EDUCATION_KEYS.items():
            value = float(row_dict.get(key, 0))
            percentage = (value / total_population * 100) if total_population > 0 else 0
            education_distribution[label] = int(round(percentage))
            log.debug(
                LOG_CATEGORIES["API"],
                "Education percentage",
                {"level": label, "percentage": education_distribution[label]},
            )

        log.info(LOG_CATEGORIES["API"], "Final Education Distribution", education_distribution)
        return education_distribution

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to get education distribution",
            {"address": address, "error": str(e)},
        )
        return {"error": str(e), "address": address}
