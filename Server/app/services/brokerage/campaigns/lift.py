"""Attach-rate lift and recovered-dollar helpers (shared fee catalog)."""

from __future__ import annotations

from app.services.brokerage.ancillary_fees import fee_for_service


def attach_rate_lift_pp(baseline_percent: float, post_percent: float) -> float:
    """Percentage-point lift from baseline to post attach rate."""
    return round(post_percent - baseline_percent, 2)


def recovered_dollars(attributed_attaches: int, fee_assumption: int) -> int:
    """Dollars recovered = attributed attaches × fee (same as leakage math)."""
    return int(attributed_attaches) * int(fee_assumption)


def recovered_by_service_row(
    service: str,
    attributed_attaches: int,
    lift_pp: float,
) -> dict:
    """Build a recovered_by_service row using the shared fee catalog."""
    fee = fee_for_service(service)
    return {
        "service": service,
        "lift_pp": lift_pp,
        "fee_assumption": fee,
        "attributed_attaches": attributed_attaches,
        "recovered_dollars": recovered_dollars(attributed_attaches, fee),
    }
