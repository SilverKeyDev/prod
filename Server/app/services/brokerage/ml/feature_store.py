from __future__ import annotations

from sqlalchemy import func, select

from app import db
from app.models.brokerage.user_org_membership import UserOrgMembership
from app.models.transactions.transaction import Transaction

TERMINAL_STATUSES = {"closed", "cancelled"}


def get_brokerage_agent_ids(brokerage_org_id: str) -> list[str]:
    return list(
        db.session.scalars(
            select(UserOrgMembership.user_id).where(
                UserOrgMembership.brokerage_org_id == brokerage_org_id,
                UserOrgMembership.role == "agent",
            )
        ).all()
    )


def build_stage_feature_rows(brokerage_org_id: str) -> list[dict]:
    stages = ["search", "tour", "offer", "contract", "closing"]
    counts: dict[str, int] = {}
    for stage in stages:
        counts[stage] = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.status == stage,
                )
            )
            or 0
        )

    rows = []
    prev = None
    for stage in stages:
        count = counts[stage]
        drop_off_percent = 0
        if prev and prev > 0:
            drop_off_percent = round((1 - count / prev) * 100)

        avg_days_since_update = (
            db.session.scalar(
                select(
                    func.avg(func.extract("epoch", func.now() - Transaction.updated_at) / 86400.0)
                ).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.status == stage,
                )
            )
            or 0.0
        )

        rows.append(
            {
                "stage": stage,
                "count": int(count),
                "drop_off_percent": int(drop_off_percent),
                "avg_days_in_stage": float(avg_days_since_update),
            }
        )
        prev = count
    return rows


def build_agent_feature_rows(brokerage_org_id: str) -> list[dict]:
    agent_ids = get_brokerage_agent_ids(brokerage_org_id)
    if not agent_ids:
        return []
    rows = []
    for agent_id in agent_ids:
        open_deals = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.primary_agent_id == agent_id,
                    Transaction.status.notin_(TERMINAL_STATUSES),
                )
            )
            or 0
        )
        stalled_deals = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.primary_agent_id == agent_id,
                    Transaction.status.notin_(TERMINAL_STATUSES),
                    func.extract("epoch", func.now() - Transaction.updated_at) / 86400.0 >= 14,
                )
            )
            or 0
        )
        avg_days_since_update = (
            db.session.scalar(
                select(
                    func.avg(func.extract("epoch", func.now() - Transaction.updated_at) / 86400.0)
                ).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.primary_agent_id == agent_id,
                    Transaction.status.notin_(TERMINAL_STATUSES),
                )
            )
            or 0.0
        )
        cancelled_count = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.primary_agent_id == agent_id,
                    Transaction.status == "cancelled",
                )
            )
            or 0
        )
        total_count = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == brokerage_org_id,
                    Transaction.primary_agent_id == agent_id,
                )
            )
            or 0
        )
        stage_dropoff_rate = float(cancelled_count / total_count) if total_count > 0 else 0.0
        rows.append(
            {
                "agent_id": agent_id,
                "open_deals": int(open_deals),
                "stalled_deals": int(stalled_deals),
                "avg_days_since_update": float(avg_days_since_update),
                "stage_dropoff_rate": float(stage_dropoff_rate),
            }
        )
    return rows


def build_monthly_volume_series(brokerage_org_id: str) -> dict[str, int]:
    rows = db.session.execute(
        select(
            func.to_char(func.date_trunc("month", Transaction.updated_at), "YYYY-MM").label(
                "month"
            ),
            func.count(Transaction.id).label("count"),
        )
        .where(
            Transaction.brokerage_org_id == brokerage_org_id,
            Transaction.status == "closed",
        )
        .group_by(func.date_trunc("month", Transaction.updated_at))
        .order_by(func.date_trunc("month", Transaction.updated_at))
    ).all()
    return {row.month: int(row.count) for row in rows}
