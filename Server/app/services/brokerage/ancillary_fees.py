"""Shared ancillary fee catalog for leakage analytics and campaign attribution.

Keep in sync with Client/packages/features/brokerage/utils/ancillaryFees.ts

Dollars = assumed brokerage placement share per in-house attach (or outside leakage).
Not consumer premiums and not RESPA referral fees.
"""

from __future__ import annotations

from typing import Final

ANCILLARY_FEE_DISCLAIMER: Final[
    str
] = "Assumed brokerage placement share per attach (not a referral fee)."

# Dollars per attach — SIL-277 / SIL-307 (placement-share assumptions)
ANCILLARY_FEES: Final[dict[str, int]] = {
    "title": 150,
    "lending": 250,
    "escrow": 100,
    "home_warranty": 75,
    "mortgage_insurance": 50,
    "homeowners_insurance": 50,
    "move_concierge": 40,
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
