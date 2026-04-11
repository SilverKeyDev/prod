"""Generic Census API client for fetching demographic data."""

import traceback

import requests

from logger import LOG_CATEGORIES, log

from .constants import CENSUS_API_KEY


def fetch_census_data_by_zip(
    zip_code: str, variable_keys: list[str], table_type: str = "profile"
) -> list:
    """Generic function to fetch Census ACS data by ZIP code.

    Args:
        zip_code: ZIP code to query
        variable_keys: List of variable keys to fetch
        table_type: Type of Census table - "profile" (DP tables), "subject" (S tables), or "detail" (B tables)

    Returns:
        list: Raw JSON response from Census API

    Raises:
        ValueError: If ZIP code is empty or API key is missing
        Exception: If Census API request fails
    """
    if not zip_code or not zip_code.strip():
        raise ValueError("❌ ZIP code is required and cannot be empty.")

    if not CENSUS_API_KEY:
        raise ValueError("❌ CENSUS_API_KEY is missing.")

    # Use the correct endpoint based on table type
    base_urls = {
        "profile": "https://api.census.gov/data/2023/acs/acs5/profile",
        "subject": "https://api.census.gov/data/2023/acs/acs5/subject",
        "detail": "https://api.census.gov/data/2023/acs/acs5",
    }
    base = base_urls.get(table_type, base_urls["profile"])

    variables = ",".join(variable_keys)
    params = {
        "get": f"NAME,{variables}",
        "for": f"zip code tabulation area:{zip_code}",
        "key": CENSUS_API_KEY,
    }

    try:
        response = requests.get(base, params=params)
        log.debug(
            LOG_CATEGORIES["API"],
            "Census request",
            {
                "url": str(response.url),
                "status_code": response.status_code,
                "table_type": table_type,
            },
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
