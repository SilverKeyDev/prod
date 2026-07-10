from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models.skyslope import SkySlopeTransaction
from scripts.skyslope.demo_config import PIPELINE_STATUSES, TERMINAL_CANCELLED, TERMINAL_CLOSED


def _agent_ids_from_tx(tx: SkySlopeTransaction) -> list[str]:
    ids: list[str] = []
    if tx.agent_id:
        ids.append(tx.agent_id)

    payload = tx.raw_payload or {}
    for key in ("demoListingAgentId", "demoBuyerAgentId"):
        value = payload.get(key)
        if value:
            ids.append(str(value))
    return ids


def _days_since(dt: datetime | None) -> float:
    if not dt:
        return 0.0
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0.0, (now - dt).total_seconds() / 86400.0)


def load_brokerage_transactions(brokerage_org_id: str) -> list[SkySlopeTransaction]:
    return list(
        db.session.scalars(
            select(SkySlopeTransaction).where(SkySlopeTransaction.brokerage_id == brokerage_org_id)
        ).all()
    )


def densify_monthly_counts(monthly: dict[str, int]) -> dict[str, int]:
    """Fill missing months with zero so sparse history is measured by span, not raw key count."""
    if not monthly:
        return {}

    keys = sorted(monthly.keys())
    start_year, start_month = (int(part) for part in keys[0].split("-"))
    end_year, end_month = (int(part) for part in keys[-1].split("-"))

    year, month = start_year, start_month
    dense: dict[str, int] = {}
    while (year, month) <= (end_year, end_month):
        key = f"{year}-{month:02d}"
        dense[key] = int(monthly.get(key, 0))
        month += 1
        if month == 13:
            month = 1
            year += 1

    return dense


def build_stage_feature_rows_from_transactions(txs: list[SkySlopeTransaction]) -> list[dict]:
    stage_counts: dict[str, int] = defaultdict(int)
    stage_days_sum: dict[str, float] = defaultdict(float)
    stage_days_n: dict[str, int] = defaultdict(int)

    for tx in txs:
        status = (tx.status or "").lower()
        if status in {TERMINAL_CLOSED, TERMINAL_CANCELLED}:
            continue
        stage_counts[status] += 1
        days = _days_since(tx.created_at)
        stage_days_sum[status] += days
        stage_days_n[status] += 1

    rows = []
    prev = None
    for stage in PIPELINE_STATUSES:
        count = stage_counts.get(stage, 0)
        drop_off_percent = 0
        if prev is not None and prev > 0:
            drop_off_percent = round((1 - count / prev) * 100)

        avg_days = 0.0
        if stage_days_n.get(stage, 0) > 0:
            avg_days = stage_days_sum[stage] / stage_days_n[stage]

        rows.append(
            {
                "stage": stage,
                "count": int(count),
                "drop_off_percent": int(drop_off_percent),
                "avg_days_in_stage": float(avg_days),
            }
        )
        prev = count

    return rows


def build_agent_feature_rows_from_transactions(txs: list[SkySlopeTransaction]) -> list[dict]:
    open_deals: dict[str, int] = defaultdict(int)
    stalled_deals: dict[str, int] = defaultdict(int)
    days_sum: dict[str, float] = defaultdict(float)
    days_n: dict[str, int] = defaultdict(int)
    cancelled: dict[str, int] = defaultdict(int)
    total: dict[str, int] = defaultdict(int)

    for tx in txs:
        agent_ids = _agent_ids_from_tx(tx)
        if not agent_ids:
            continue

        status = (tx.status or "").lower()
        days = _days_since(tx.created_at)

        for agent_id in agent_ids:
            total[agent_id] += 1
            if status == TERMINAL_CANCELLED:
                cancelled[agent_id] += 1
            if status not in {TERMINAL_CLOSED, TERMINAL_CANCELLED}:
                open_deals[agent_id] += 1
                days_sum[agent_id] += days
                days_n[agent_id] += 1
                if days >= 90:
                    stalled_deals[agent_id] += 1

    rows = []
    for agent_id, total_count in total.items():
        avg_days = (days_sum[agent_id] / days_n[agent_id]) if days_n[agent_id] else 0.0
        dropoff_rate = (cancelled[agent_id] / total_count) if total_count else 0.0
        rows.append(
            {
                "agent_id": agent_id,
                "open_deals": int(open_deals[agent_id]),
                "stalled_deals": int(stalled_deals[agent_id]),
                "avg_days_since_update": float(avg_days),
                "stage_dropoff_rate": float(dropoff_rate),
            }
        )
    return rows


def build_monthly_volume_series_from_transactions(txs: list[SkySlopeTransaction]) -> dict[str, int]:
    monthly: dict[str, int] = defaultdict(int)

    for tx in txs:
        if (tx.status or "").lower() != TERMINAL_CLOSED:
            continue
        dt = tx.closed_at or tx.updated_at
        if not dt:
            continue
        key = f"{dt.year}-{dt.month:02d}"
        monthly[key] += 1

    return dict(sorted(monthly.items()))


def build_feature_sets(
    brokerage_org_id: str,
    txs: list[SkySlopeTransaction] | None = None,
) -> tuple[list[dict], list[dict], dict[str, int]]:
    """Load SkySlope rows once and derive all SIL-208 feature sets."""
    loaded = txs if txs is not None else load_brokerage_transactions(brokerage_org_id)
    monthly = densify_monthly_counts(build_monthly_volume_series_from_transactions(loaded))
    return (
        build_stage_feature_rows_from_transactions(loaded),
        build_agent_feature_rows_from_transactions(loaded),
        monthly,
    )


def build_stage_feature_rows(brokerage_org_id: str) -> list[dict]:
    stage_rows, _, _ = build_feature_sets(brokerage_org_id)
    return stage_rows


def build_agent_feature_rows(brokerage_org_id: str) -> list[dict]:
    _, agent_rows, _ = build_feature_sets(brokerage_org_id)
    return agent_rows


def build_monthly_volume_series(brokerage_org_id: str) -> dict[str, int]:
    _, _, monthly_counts = build_feature_sets(brokerage_org_id)
    return monthly_counts
