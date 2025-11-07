"""
Helper functions for constructing Zillow URLs from property data.
"""
from __future__ import annotations

import re
from typing import Dict, Any, Optional
from flask import current_app


def _slugify_address(street: str, city: str, state: str, zipcode: str | None = None) -> str:
    """Create a URL-friendly slug from address components."""
    parts = [street or "", city or "", state or ""]
    if zipcode:
        parts.append(str(zipcode))
    base = "-".join(p.strip() for p in parts if p and p.strip())
    return re.sub(r"[^A-Za-z0-9]+", "-", base).strip("-")


def extract_address_fields_from_data(data: dict) -> tuple[str, str, str, str | None]:
    """
    Prefer data['address'] {...}; fall back to top-level keys.
    """
    street = city = state = ""
    zipcode = None

    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city   = (addr.get("city") or "").strip()
        state  = (addr.get("state") or "").strip()
        zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
        zipcode = (str(zipcode).strip() if zipcode else None)

    # fallbacks if nested block was incomplete
    street = street or (data.get("streetAddress") or "").strip()
    city   = city   or (data.get("city") or "").strip()
    state  = state  or (data.get("state") or "").strip()
    zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)

    return street, city, state, zipcode


def build_zillow_url(data: Dict[str, Any] | None, params: Dict[str, Any] | None = None) -> str | None:
    """
    Build a Zillow URL from property data and/or params.
    
    Priority order:
    1. Direct/relative URL from payload (url, detailUrl, homeDetailsUrl, propertyUrl, hdpUrl)
    2. Canonical URL constructed from zpid + address slug
    3. ZPID-only homedetails route
    
    Args:
        data: Property data dictionary from API response
        params: Request parameters dictionary (may contain zpid)
        
    Returns:
        Zillow URL string or None if construction fails
    """
    zillow_url = None
    zillow_base = "https://www.zillow.com"

    try:
        if isinstance(data, dict):
            # 1) Prefer direct/relative URL from payload
            for key in ("url", "detailUrl", "homeDetailsUrl", "propertyUrl", "hdpUrl"):
                val = data.get(key)
                if isinstance(val, str) and val.strip():
                    if val.startswith("http"):
                        zillow_url = val
                    elif val.startswith("/"):
                        zillow_url = f"{zillow_base}{val}"
                    # If found anything, stop here
                    if zillow_url:
                        break

        # 2) zpid from params or payload
        zpid_val = None
        if isinstance(params, dict) and params.get("zpid"):
            zpid_val = str(params["zpid"]).strip()
        if not zpid_val and isinstance(data, dict) and data.get("zpid"):
            zpid_val = str(data["zpid"]).strip()

        # 3) Address parts for slug (from nested 'address' first)
        street, city, state, zipcode = extract_address_fields_from_data(data) if isinstance(data, dict) else ("", "", "", None)

        # 4) Construct canonical URL if not provided
        if not zillow_url and zpid_val and street and city and state:
            slug = _slugify_address(street, city, state, zipcode)
            zillow_url = f"{zillow_base}/homedetails/{slug}/{zpid_val}_zpid/"

        # 5) Last-resort: zpid-only homedetails route
        if not zillow_url and zpid_val:
            zillow_url = f"{zillow_base}/homedetails/{zpid_val}_zpid/"

    except Exception as e:
        try:
            current_app.logger.warning(f"🔗 [PROPERTY] Failed to build Zillow URL: {e}")
        except RuntimeError:
            # Flask application context not available (e.g., in tests)
            pass
    
    return zillow_url

