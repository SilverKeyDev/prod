"""
Price soft fit: best near configurable fraction of max budget (default ~65%).

In-budget listings map to [IN_BUDGET_SIGNAL_FLOOR, 1.0] so affordable homes inside the
user's band are not crushed at the budget edges (legacy triangular model hit 0.0 at min/max).
"""

from __future__ import annotations

from typing import Any

# Any listing within [min, max] gets at least a neutral-positive price signal.
_IN_BUDGET_SIGNAL_FLOOR = 0.60


def _parse_money(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace("$", "").replace(",", "").strip()
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None
    return None


def effective_budget_bounds(
    preferences: dict[str, Any], status_type: str
) -> tuple[float | None, float | None]:
    """
    Return (min, max) listing-price units comparable to API listing price.
    For sale: annual dollars. For rent: monthly (prefs stored annual → /12).
    """
    budget_max = _parse_money(preferences.get("home_budget_max") or preferences.get("price_max"))
    budget_min = _parse_money(preferences.get("home_budget_min") or preferences.get("price_min"))
    if not budget_max or budget_max <= 0:
        return (None, None)

    if status_type == "ForRent":
        eff_max = budget_max / 12.0
        if budget_min and budget_min > 0:
            eff_min = budget_min / 12.0
        else:
            eff_min = budget_max * 0.7 / 12.0
        return (eff_min, eff_max)

    eff_max = budget_max
    if budget_min and budget_min > 0:
        eff_min = budget_min
    else:
        eff_min = budget_max * 0.65
    return (eff_min, eff_max)


def listing_price(property_dict: dict[str, Any]) -> float | None:
    return _parse_money(
        property_dict.get("price")
        or property_dict.get("listPrice")
        or property_dict.get("ListPrice")
        or property_dict.get("unformattedPrice")
    )


def _in_budget_price_signal(t: float) -> float:
    """Map triangular position t in [0, 1] to [floor, 1.0]."""
    clamped = max(0.0, min(1.0, t))
    span = 1.0 - _IN_BUDGET_SIGNAL_FLOOR
    return _IN_BUDGET_SIGNAL_FLOOR + span * clamped


def soft_price_normalized(
    preferences: dict[str, Any],
    property_dict: dict[str, Any],
    status_type: str,
    price_peak_ratio: float,
) -> float:
    """
    Soft score in [IN_BUDGET_SIGNAL_FLOOR, 1] inside [min, max], peak at ideal price.
    Above max returns low soft (hard layer also penalizes).
    """
    lo, hi = effective_budget_bounds(preferences, status_type)
    if lo is None or hi is None or hi <= 0:
        return 0.5

    p = listing_price(property_dict)
    if p is None or p <= 0:
        return 0.5

    lo = min(lo, hi)
    ideal = price_peak_ratio * hi
    if ideal < lo:
        ideal = lo
    if ideal > hi:
        ideal = hi

    if p > hi:
        # Soft tail above budget (hard_constraint_multiplier still applies); slightly less harsh.
        return 0.22

    if p < lo:
        if lo <= 0:
            return 0.5
        return max(0.2, min(1.0, 0.35 + 0.65 * (p / lo)))

    if abs(hi - lo) < 1e-6:
        return 1.0 if abs(p - ideal) < 1e-6 else 0.5

    if p <= ideal:
        span = ideal - lo
        if span < 1e-6:
            return 1.0
        return _in_budget_price_signal((p - lo) / span)

    span = hi - ideal
    if span < 1e-6:
        return 1.0
    return _in_budget_price_signal((hi - p) / span)
