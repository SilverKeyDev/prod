"""Monthly cost add-ons (HOA, utilities) — stubs until external APIs exist."""

from __future__ import annotations

import re

from .area_utilities_estimate import estimate_area_utilities_monthly
from .hoa_estimate import estimate_hoa_monthly_dues

_ZIP5 = re.compile(r"^\d{5}")


def monthly_cost_addon_estimates(
    zipcode: str,
    *,
    listing_context: dict | None = None,
) -> dict[str, float]:
    """
    Normalize ZIP and return placeholder HOA and utilities monthly amounts.

    Raises
    ------
    ValueError
        If zipcode does not start with five digits.
    """
    raw = (zipcode or "").strip()
    if not raw or not _ZIP5.match(raw):
        raise ValueError("zipcode must include at least five digits")
    z5 = raw[:5]
    hoa = estimate_hoa_monthly_dues(zipcode=z5, listing_payload=listing_context)
    util = estimate_area_utilities_monthly(zipcode=z5)
    return {
        "hoa_monthly": float(hoa),
        "utilities_monthly": float(util),
    }
