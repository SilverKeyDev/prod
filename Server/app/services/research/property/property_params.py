"""
Parameter parsing utilities for property research endpoints.
Handles building API parameters from request body.
"""

from typing import Any


def build_property_params(
    zpid: str | None = None, property_url: str | None = None, address: str | None = None
) -> dict[str, str] | None:
    """
    Build API parameters from request body with priority: zpid > property_url > address.

    Args:
        zpid: Optional ZPID string
        property_url: Optional property URL string
        address: Optional address string

    Returns:
        Dict with API parameters, or None if none provided
    """
    params = None

    # Priority: zpid > property_url > address
    if zpid is not None:
        s = str(zpid).strip()
        if s:
            try:
                params = {"zpid": str(int(s))}
            except Exception:
                # MLS / non-numeric listing ids (still sent as Slipstream `id` downstream)
                params = {"zpid": s}

    if params is None and isinstance(property_url, str) and property_url.strip():
        params = {"property_url": property_url.strip()}

    if params is None and isinstance(address, str) and address.strip():
        params = {"address": address.strip()}

    return params


def extract_property_address(address: str | None, data: dict[str, Any] | None) -> str | None:
    """
    Extract property address from address string or property data.

    Args:
        address: Optional address string from request
        data: Optional property data dict

    Returns:
        Full address string if found, None otherwise
    """
    if address:
        return address.strip()

    if data and isinstance(data, dict):
        street = data.get("streetAddress", "")
        city = data.get("city", "")
        state = data.get("state", "")
        zipcode = data.get("zipcode", "")
        if street and city and state:
            return f"{street}, {city}, {state} {zipcode}".strip()

    return None


def extract_zpid(params: dict[str, Any] | None, data: dict[str, Any] | None) -> str | None:
    """
    Extract ZPID from params or data.

    Args:
        params: API parameters dict
        data: Property data dict

    Returns:
        ZPID string if found, None otherwise
    """
    zpid_val = None

    if isinstance(params, dict) and params.get("zpid"):
        zpid_val = str(params["zpid"]).strip()

    if not zpid_val and isinstance(data, dict) and data.get("zpid"):
        zpid_val = str(data["zpid"]).strip()

    return zpid_val
