"""Shared ancillary fee catalog for leakage analytics and campaign attribution.

Keep in sync with Client/packages/features/brokerage/utils/ancillaryFees.ts
"""

from __future__ import annotations

from typing import Final

# Dollars per in-house attach (or outside leakage) assumption — SIL-277 / SIL-307
ANCILLARY_FEES: Final[dict[str, int]] = {
    "title": 500,
    "lending": 1000,
    "escrow": 400,
    "home_warranty": 150,
    "mortgage_insurance": 200,
}

ANCILLARY_SERVICE_ORDER: Final[tuple[str, ...]] = (
    "title",
    "lending",
    "escrow",
    "home_warranty",
)


def fee_for_service(service: str) -> int:
    """Return fee assumption for a service key; raises KeyError if unknown."""
    return ANCILLARY_FEES[service]
