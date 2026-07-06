"""QA validation for SIL-285 SkySlope synthetic demo dataset."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

import pandas as pd

from scripts.skyslope.demo_config import TERMINAL_CANCELLED, TERMINAL_CLOSED


@dataclass
class ValidationResult:
    passed: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    stats: dict[str, Any] = field(default_factory=dict)


def _parse_date(value: Any) -> date | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.date()


def validate_demo_dataset(
    offices: pd.DataFrame,
    agents: pd.DataFrame,
    clients: pd.DataFrame,
    properties: pd.DataFrame,
    deals: pd.DataFrame,
    compliance: pd.DataFrame,
) -> ValidationResult:
    """Run consistency checks before loading data into demo dashboards."""
    result = ValidationResult(passed=True)

    required_tables = {
        "offices": offices,
        "agents": agents,
        "clients": clients,
        "properties": properties,
        "deals": deals,
        "compliance": compliance,
    }
    for name, frame in required_tables.items():
        if frame.empty:
            result.errors.append(f"{name} table is empty")
            result.passed = False

    office_ids = set(offices["office_id"].astype(str))
    agent_ids = set(agents["agent_id"].astype(str))
    client_ids = set(clients["client_id"].astype(str))
    property_ids = set(properties["property_id"].astype(str))
    deal_ids = set(deals["deal_id"].astype(str))

    # Foreign keys — agents → offices
    orphan_agents = set(agents["office_id"].astype(str)) - office_ids
    if orphan_agents:
        result.errors.append(f"agents reference unknown office_id: {sorted(orphan_agents)[:5]}")
        result.passed = False

    # Foreign keys — deals
    for col, valid, label in (
        ("office_id", office_ids, "office"),
        ("property_id", property_ids, "property"),
        ("listing_agent_id", agent_ids, "listing agent"),
        ("buyer_agent_id", agent_ids, "buyer agent"),
    ):
        refs = set(deals[col].dropna().astype(str))
        orphans = refs - valid
        if orphans:
            result.errors.append(f"deals reference unknown {label}: {sorted(orphans)[:5]}")
            result.passed = False

    # Compliance → deals (1:1)
    comp_deal_ids = set(compliance["deal_id"].astype(str))
    missing_compliance = deal_ids - comp_deal_ids
    extra_compliance = comp_deal_ids - deal_ids
    if missing_compliance:
        result.errors.append(f"{len(missing_compliance)} deals missing compliance rows")
        result.passed = False
    if extra_compliance:
        result.errors.append(f"{len(extra_compliance)} compliance rows reference unknown deals")
        result.passed = False

    closed = deals[deals["status"] == TERMINAL_CLOSED]
    cancelled = deals[deals["status"] == TERMINAL_CANCELLED]

    # close_date only on closed deals
    closed_with_null_close = closed["close_date"].isna().sum()
    non_closed_with_close = deals[
        (deals["status"] != TERMINAL_CLOSED) & deals["close_date"].notna()
    ]
    if closed_with_null_close:
        result.errors.append(f"{closed_with_null_close} closed deals missing close_date")
        result.passed = False
    if len(non_closed_with_close):
        result.errors.append(f"{len(non_closed_with_close)} non-closed deals have close_date")
        result.passed = False

    # contract_date >= list_date
    date_violations = 0
    for _, row in deals.iterrows():
        list_d = _parse_date(row["list_date"])
        contract_d = _parse_date(row.get("contract_date"))
        close_d = _parse_date(row.get("close_date"))
        if list_d and contract_d and contract_d < list_d:
            date_violations += 1
        if contract_d and close_d and close_d < contract_d:
            date_violations += 1
    if date_violations:
        result.errors.append(f"{date_violations} deals violate date ordering")
        result.passed = False

    # GCI ties to sale_price & commission_rate (closed deals with sale_price)
    gci_mismatches = 0
    for _, row in closed.iterrows():
        sale_price = row.get("sale_price")
        commission_rate = row.get("commission_rate")
        gci = row.get("gci")
        agent_split = row.get("agent_split")
        if pd.isna(sale_price) or pd.isna(commission_rate) or pd.isna(gci):
            continue
        expected = round(float(sale_price) * float(commission_rate) * float(agent_split), 2)
        if abs(float(gci) - expected) > 0.02:
            gci_mismatches += 1
    if gci_mismatches:
        result.errors.append(f"{gci_mismatches} closed deals have GCI != sale_price * rate * split")
        result.passed = False

    # Compliance completed <= required
    over_complete = compliance[compliance["completed_docs"] > compliance["required_docs"]]
    if len(over_complete):
        result.errors.append(
            f"{len(over_complete)} compliance rows have completed_docs > required_docs"
        )
        result.passed = False

    # Summary stats for QA report
    total = len(deals)
    cancel_rate = len(cancelled) / total if total else 0.0
    result.stats = {
        "offices": len(offices),
        "agents": len(agents),
        "clients": len(clients),
        "properties": len(properties),
        "deals": total,
        "closed_deals": len(closed),
        "cancelled_deals": len(cancelled),
        "cancellation_rate_percent": round(cancel_rate * 100, 1),
    }

    if closed["close_date"].notna().any():
        days_to_close = []
        for _, row in closed.iterrows():
            contract_d = _parse_date(row.get("contract_date"))
            close_d = _parse_date(row.get("close_date"))
            if contract_d and close_d:
                days_to_close.append((close_d - contract_d).days)
        if days_to_close:
            result.stats["avg_days_to_close"] = round(sum(days_to_close) / len(days_to_close), 1)

    if cancel_rate < 0.08 or cancel_rate > 0.18:
        result.warnings.append(f"Cancellation rate {cancel_rate:.1%} outside target 10–15% band")

    return result
