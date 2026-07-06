"""Map SIL-285 demo CSV rows to SkySlopeTransaction persistence kwargs."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import date, datetime, timezone
from typing import Any

import pandas as pd

from app.services.skyslope.mapping import map_skyslope_transaction

_SIDE_TO_SKYSLOPE = {
    "listing": "seller",
    "buyer": "buyer",
    "dual": "both",
}

_PROPERTY_TYPE_TO_SKYSLOPE = {
    "single_family": "residential",
    "condo": "residential",
    "townhouse": "residential",
    "multi_family": "residential",
    "land": "land",
}


def _scalar(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    if pd.isna(value):
        return None
    return value


def _to_iso_datetime(value: Any) -> str | None:
    value = _scalar(value)
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")
    if isinstance(value, date):
        return (
            datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.tz_localize(timezone.utc)
    return parsed.isoformat().replace("+00:00", "Z")


def build_skyslope_raw_from_demo(
    deal: Mapping[str, Any],
    property_row: Mapping[str, Any],
    compliance_row: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Build a SkySlope API-shaped dict from demo deal + property (+ optional compliance).

    Extra demo analytics fields are included so they persist in raw_payload JSONB.
    """
    status = str(deal["status"])
    is_cancelled = status == "cancelled"

    raw: dict[str, Any] = {
        "transactionId": str(deal["deal_id"]),
        "status": status,
        "createdDate": _to_iso_datetime(deal.get("list_date")),
        "closedDate": _to_iso_datetime(deal.get("close_date")),
        "cancelledDate": _to_iso_datetime(deal.get("cancellation_date")),
        "isCancelled": is_cancelled,
        "salePrice": _scalar(deal.get("sale_price")),
        "listPrice": _scalar(property_row.get("list_price")),
        "propertyAddress": _scalar(property_row.get("address")),
        "city": _scalar(property_row.get("city")),
        "state": _scalar(property_row.get("state")),
        "zip": _scalar(property_row.get("zip")),
        "latitude": _scalar(property_row.get("latitude")),
        "longitude": _scalar(property_row.get("longitude")),
        "side": _SIDE_TO_SKYSLOPE.get(str(deal.get("side", "")), deal.get("side")),
        "propertyType": _PROPERTY_TYPE_TO_SKYSLOPE.get(
            str(property_row.get("type", "")),
            property_row.get("type"),
        ),
        "titleCompany": _scalar(deal.get("title_vendor")),
        "lender": _scalar(deal.get("lender")),
        "escrow": _scalar(deal.get("escrow_company")),
        "hasHomeWarranty": bool(_scalar(deal.get("has_home_warranty")) or False),
        # Demo-only fields preserved in raw_payload for analytics / forensics.
        "demoOfficeId": _scalar(deal.get("office_id")),
        "demoListingAgentId": _scalar(deal.get("listing_agent_id")),
        "demoBuyerAgentId": _scalar(deal.get("buyer_agent_id")),
        "demoLeadSource": _scalar(deal.get("lead_source")),
        "demoContractDate": _to_iso_datetime(deal.get("contract_date")),
        "demoCommissionRate": _scalar(deal.get("commission_rate")),
        "demoAgentSplit": _scalar(deal.get("agent_split")),
        "demoGci": _scalar(deal.get("gci")),
        "demoStageAtCancellation": _scalar(deal.get("stage_at_cancellation")),
        "demoPropertyBeds": _scalar(property_row.get("beds")),
    }

    if compliance_row is not None:
        required = _scalar(compliance_row.get("required_docs"))
        completed = _scalar(compliance_row.get("completed_docs"))
        raw.update(
            {
                "demoRequiredDocs": required,
                "demoCompletedDocs": completed,
                "demoComplianceRate": (
                    round(float(completed) / float(required), 4)
                    if required and completed is not None and float(required) > 0
                    else None
                ),
                "demoBrokerReviewStatus": _scalar(compliance_row.get("broker_review_status")),
                "demoEsignSent": _to_iso_datetime(compliance_row.get("esign_sent")),
                "demoEsignCompletedDate": _to_iso_datetime(
                    compliance_row.get("esign_completed_date")
                ),
            }
        )

    return raw


def map_demo_deal_to_transaction_row(
    deal: Mapping[str, Any],
    property_row: Mapping[str, Any],
    *,
    brokerage_id: str,
    compliance_row: Mapping[str, Any] | None = None,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Map demo CSV rows → kwargs accepted by upsert_skyslope_transactions."""
    raw = build_skyslope_raw_from_demo(deal, property_row, compliance_row)
    return map_skyslope_transaction(raw, brokerage_id=brokerage_id, agent_id=agent_id)
