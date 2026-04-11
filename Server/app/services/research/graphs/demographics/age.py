"""Age distribution data retrieval and processing."""

import traceback

from logger import LOG_CATEGORIES, log

from .constants import AGE_GROUP_KEYS, CENSUS_API_KEY
from .geocoding import get_zip_from_address


def fetch_age_table_by_zip(zip_code):
    """Fetch age distribution data from Census API for a specific ZIP code.

    Args:
        zip_code: ZIP code to query

    Returns:
        list: Raw JSON response with age data

    Raises:
        ValueError: If ZIP code is empty or API key is missing
        Exception: If Census API request fails
    """
    if not zip_code or not zip_code.strip():
        raise ValueError("❌ ZIP code is required and cannot be empty.")

    if not CENSUS_API_KEY:
        raise ValueError("❌ CENSUS_API_KEY is missing.")

    variable_keys = ",".join(sum(AGE_GROUP_KEYS.values(), []))

    # Use the subject endpoint for S0101 table
    import requests

    base = "https://api.census.gov/data/2023/acs/acs5/subject"
    params = {
        "get": f"NAME,{variable_keys},S0101_C01_001E",
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_API_KEY,
    }

    try:
        response = requests.get(base, params=params)
        log.debug(
            LOG_CATEGORIES["API"],
            "Census request",
            {"url": str(response.url), "status_code": response.status_code},
        )
        if response.status_code != 200:
            raise Exception(
                f"❌ Census API returned status {response.status_code}: {response.text}"
            )
        if not response.text.strip():
            raise Exception(f"❌ Census API returned empty response for ZIP {zip_code}")
        return response.json()
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"], "Census API error", {"error": str(e), "zip_code": zip_code}
        )
        traceback.print_exc()
        raise


def parse_age_distribution(data):
    """Parse raw Census age data into age group percentages.

    Args:
        data: Raw Census API response data

    Returns:
        dict: Age group labels mapped to percentage values

    Raises:
        Exception: If parsing fails
    """
    log.debug(LOG_CATEGORIES["API"], "Parsing age distribution")
    try:
        header = data[0]
        row = data[1]
        row_dict = dict(zip(header, row, strict=False))

        total_population = float(row_dict["S0101_C01_001E"])
        log.debug(LOG_CATEGORIES["API"], "Total Population", {"total_population": total_population})

        age_buckets = {}
        for group, keys in AGE_GROUP_KEYS.items():
            total = sum(float(row_dict.get(k, 0)) for k in keys)
            pct = round((total / total_population) * 100)
            age_buckets[group] = int(pct)
            log.debug(
                LOG_CATEGORIES["API"], "Age group percentage", {"group": group, "percentage": pct}
            )

        return age_buckets
    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], "Error parsing age distribution", {"error": str(e)})
        traceback.print_exc()
        raise


def get_age_distribution(address: str) -> dict:
    """Top-level importable function for age distribution lookup by address.

    Args:
        address: Full address string

    Returns:
        dict: Age group labels mapped to percentage values, or error dict
    """
    try:
        log.info(LOG_CATEGORIES["API"], "Starting Age Distribution Lookup", {"address": address})

        zip_code = get_zip_from_address(address)
        raw_data = fetch_age_table_by_zip(zip_code)
        distribution = parse_age_distribution(raw_data)

        log.info(LOG_CATEGORIES["API"], "Final Age Distribution", distribution)
        return distribution
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to get age distribution",
            {"address": address, "error": str(e)},
        )
        return {"error": str(e), "address": address}


def get_population_total(address: str) -> dict:
    """Returns the total population for a given address using Census ZIP data.

    Args:
        address: Full address string

    Returns:
        dict: Contains 'total_population' key with population count, or error dict
    """
    try:
        log.info(LOG_CATEGORIES["API"], "Starting Total Population Lookup", {"address": address})

        zip_code = get_zip_from_address(address)
        raw_data = fetch_age_table_by_zip(zip_code)

        header = raw_data[0]
        row = raw_data[1]
        row_dict = dict(zip(header, row, strict=False))
        total_population = int(float(row_dict["S0101_C01_001E"]))

        log.info(
            LOG_CATEGORIES["API"],
            "Total Population in ZIP",
            {"zip_code": zip_code, "total_population": total_population},
        )

        return {"total_population": total_population}

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Failed to get population",
            {"address": address, "error": str(e)},
        )
        return {"error": str(e), "address": address}
