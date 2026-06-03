"""Address to ZIP code conversion using Google Maps Geocoding API."""

import traceback

import requests

from logger import log

from .constants import GOOGLE_MAPS_API_KEY


def get_zip_from_address(address):
    """Convert an address to its ZIP code using Google Maps Geocoding API.

    Args:
        address: Full address string

    Returns:
        str: ZIP code extracted from the address

    Raises:
        ValueError: If address is empty or API key is missing
        Exception: If geocoding fails or ZIP code not found
    """
    if not address or not address.strip():
        raise ValueError("❌ Address is required and cannot be empty.")

    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("❌ GOOGLE_MAPS_API_KEY is missing.")

    endpoint = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address.strip(), "key": GOOGLE_MAPS_API_KEY}

    try:
        res = requests.get(endpoint, params=params)
        log.debug("API", "Geocode request URL", {"url": str(res.url)})
        data = res.json()
        if data["status"] != "OK":
            raise Exception(f"❌ Geocoding failed: {data['status']}")

        components = data["results"][0]["address_components"]
        for comp in components:
            if "postal_code" in comp["types"]:
                zip_code = comp["long_name"]
                log.debug("API", "Found ZIP code", {"zip_code": zip_code})
                return zip_code

        raise Exception("❌ ZIP code not found in geocoding result.")
    except Exception as e:
        log.error("ERRORS", "Geocoding error", {"error": str(e)})
        traceback.print_exc()
        raise
