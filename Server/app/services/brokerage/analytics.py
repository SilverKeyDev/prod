"""Brokerage analytics aggregation service.

Produces metric payloads for brokerage and integration-partner dashboards.
Mirrors the planned GET /api/v1/brokerage/analytics/* response shapes (SIL-202/SIL-274).
TODO SIL-272: Replace stub/fixture returns with real SkySlope queries
              once the transaction sync schema lands.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app import db
from app.models import User
from app.models.brokerage.brokerage_org import BrokerageOrg
from app.models.brokerage.user_org_membership import UserOrgMembership
from app.models.transactions.transaction import Transaction
from app.services.brokerage.analytics_timeline import (
    default_range,
    period_scale,
    scale_int,
    scale_money,
)


@dataclass(frozen=True)
class BrokerageAnalyticsFilters:
    brokerage_org_id: str
    date_from: datetime | None = None
    date_to: datetime | None = None
    timeline: str | None = None


def _default_range() -> tuple[datetime, datetime]:
    return default_range()


def _resolved_range(filters: BrokerageAnalyticsFilters) -> tuple[datetime, datetime]:
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()
    return date_from, date_to


def _stub_meta(filters: BrokerageAnalyticsFilters) -> dict:
    date_from, date_to = _resolved_range(filters)
    meta: dict = {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
    }
    if filters.timeline:
        meta["timeline"] = filters.timeline
    return meta


def _scale(filters: BrokerageAnalyticsFilters) -> float:
    return period_scale(filters.timeline)


def _agent_ids_for_brokerage(brokerage_org_id: str) -> list[str]:
    """Return all agent user IDs that are members of this brokerage."""
    rows = db.session.scalars(
        select(UserOrgMembership.user_id).where(
            UserOrgMembership.brokerage_org_id == brokerage_org_id,
            UserOrgMembership.role == "agent",
        )
    ).all()
    return list(rows)


def get_brokerage_analytics_overview(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate brokerage-scoped metrics for the analytics dashboard.

    Scopes all queries to the given brokerage_org_id via UserOrgMembership
    and Transaction.brokerage_org_id — no cross-brokerage data leakage.

    Returns a dict mirroring the planned SIL-202 OpenAPI response schema.
    """
    brokerage = db.session.scalar(
        select(BrokerageOrg).where(BrokerageOrg.id == filters.brokerage_org_id)
    )
    if not brokerage:
        return {"success": False, "error": "brokerage_not_found"}

    date_from, date_to = _resolved_range(filters)

    agent_ids = _agent_ids_for_brokerage(filters.brokerage_org_id)

    # --- Overview KPIs ---
    active_agents = len(agent_ids)

    open_transactions = (
        db.session.scalar(
            select(func.count(Transaction.id)).where(
                Transaction.brokerage_org_id == filters.brokerage_org_id,
                Transaction.status.notin_(["closed", "cancelled"]),
            )
        )
        or 0
    )

    at_risk_agents = 0
    if agent_ids:
        stalled_cutoff = datetime.now(timezone.utc) - timedelta(days=14)
        active_agent_ids = db.session.scalars(
            select(Transaction.primary_agent_id)
            .where(
                Transaction.brokerage_org_id == filters.brokerage_org_id,
                Transaction.primary_agent_id.in_(agent_ids),
                Transaction.status.notin_(["closed", "cancelled"]),
                Transaction.updated_at >= stalled_cutoff,
            )
            .distinct()
        ).all()
        active_set = set(active_agent_ids)
        at_risk_agents = sum(1 for a in agent_ids if a not in active_set)

    # --- Transaction funnel ---
    FUNNEL_STAGES = ["search", "tour", "offer", "contract", "closing"]
    funnel = []
    prev_count = None
    for stage in FUNNEL_STAGES:
        count = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == filters.brokerage_org_id,
                    Transaction.status == stage,
                )
            )
            or 0
        )
        drop_off_percent = 0
        if prev_count is not None and prev_count > 0:
            drop_off_percent = round((1 - count / prev_count) * 100)
        funnel.append(
            {
                "stage": stage.capitalize(),
                "count": count,
                "drop_off_percent": drop_off_percent,
            }
        )
        prev_count = count

    # --- Agent performance ---
    agent_performance = []
    if agent_ids:
        for agent_id in agent_ids:
            agent = db.session.scalar(select(User).where(User.id == agent_id))
            if not agent:
                continue
            active_clients = (
                db.session.scalar(
                    select(func.count(Transaction.id)).where(
                        Transaction.primary_agent_id == agent_id,
                        Transaction.brokerage_org_id == filters.brokerage_org_id,
                        Transaction.status.notin_(["closed", "cancelled"]),
                    )
                )
                or 0
            )
            closings = (
                db.session.scalar(
                    select(func.count(Transaction.id)).where(
                        Transaction.primary_agent_id == agent_id,
                        Transaction.brokerage_org_id == filters.brokerage_org_id,
                        Transaction.status == "closing",
                        Transaction.updated_at >= date_from,
                        Transaction.updated_at <= date_to,
                    )
                )
                or 0
            )
            agent_performance.append(
                {
                    "agent_id": agent_id,
                    "name": agent.name,
                    "active_clients": active_clients,
                    "closings": closings,
                }
            )

    result = {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "brokerage_name": brokerage.name,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "overview": {
            "active_agents": active_agents,
            "open_transactions": open_transactions,
            "at_risk_agents": at_risk_agents,
        },
        "transaction_funnel": funnel,
        "agent_performance": agent_performance,
    }
    if filters.timeline:
        result["timeline"] = filters.timeline
    return result


# ---------------------------------------------------------------------------
# Per-graph-type aggregation functions — SIL-274
# Each function mirrors the shape of its corresponding API route response.
# TODO SIL-272: Replace stub/fixture returns with real SkySlope queries
#               once the transaction sync schema lands.
# ---------------------------------------------------------------------------


def get_volume_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction volume over time for the brokerage.
    Returns monthly transaction counts and cancellation rates.
    Powers GET /api/v1/brokerage/analytics/volume
    """
    scale = _scale(filters)
    volume = [
        {"month": "2026-01", "total": 8, "cancelled": 1, "cancellation_rate": 12.5},
        {"month": "2026-02", "total": 11, "cancelled": 0, "cancellation_rate": 0.0},
        {"month": "2026-03", "total": 9, "cancelled": 2, "cancellation_rate": 22.2},
        {"month": "2026-04", "total": 14, "cancelled": 1, "cancellation_rate": 7.1},
        {"month": "2026-05", "total": 12, "cancelled": 0, "cancellation_rate": 0.0},
        {"month": "2026-06", "total": 18, "cancelled": 1, "cancellation_rate": 5.6},
    ]
    scaled_volume = [
        {
            **row,
            "total": scale_int(row["total"], scale),
            "cancelled": scale_int(row["cancelled"], scale),
        }
        for row in volume
    ]
    total_tx = sum(r["total"] for r in scaled_volume)
    total_cancelled = sum(r["cancelled"] for r in scaled_volume)
    return {
        **_stub_meta(filters),
        "volume": scaled_volume,
        "summary": {
            "total_transactions": total_tx,
            "total_cancelled": total_cancelled,
            "avg_cancellation_rate": round(total_cancelled / total_tx * 100, 1)
            if total_tx
            else 0.0,
        },
    }


def get_price_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction price metrics over time.
    Returns median, min, and max transaction values.
    Powers GET /api/v1/brokerage/analytics/price
    """
    # Price levels are not volume-scaled; echo timeline meta only.
    return {
        **_stub_meta(filters),
        "price": [
            {"month": "2026-01", "median": 485000, "min": 210000, "max": 1200000},
            {"month": "2026-02", "median": 510000, "min": 185000, "max": 980000},
            {"month": "2026-03", "median": 495000, "min": 220000, "max": 1450000},
            {"month": "2026-04", "median": 525000, "min": 195000, "max": 1100000},
            {"month": "2026-05", "median": 540000, "min": 230000, "max": 1350000},
            {"month": "2026-06", "median": 558000, "min": 240000, "max": 1600000},
        ],
        "summary": {
            "overall_median": 519000,
            "overall_min": 185000,
            "overall_max": 1600000,
        },
    }


def get_location_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction locations for heat map rendering.
    Returns geo points with transaction counts per area.
    Powers GET /api/v1/brokerage/analytics/location
    """
    scale = _scale(filters)
    locations = [
        {"lat": 33.749, "lng": -84.388, "count": 12, "label": "Atlanta, GA"},
        {"lat": 33.830, "lng": -84.320, "count": 8, "label": "Brookhaven, GA"},
        {"lat": 33.680, "lng": -84.430, "count": 6, "label": "East Point, GA"},
        {"lat": 33.900, "lng": -84.210, "count": 5, "label": "Tucker, GA"},
        {"lat": 33.770, "lng": -84.290, "count": 9, "label": "Decatur, GA"},
    ]
    return {
        **_stub_meta(filters),
        "locations": [{**row, "count": scale_int(row["count"], scale)} for row in locations],
    }


def get_type_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction breakdown by type.
    Returns buyer/seller split and property type distribution.
    Powers GET /api/v1/brokerage/analytics/type
    """
    scale = _scale(filters)
    return {
        **_stub_meta(filters),
        "client_type": {
            "buyers": scale_int(42, scale),
            "sellers": scale_int(28, scale),
            "both": scale_int(2, scale),
        },
        "property_type": {
            "residential": scale_int(58, scale),
            "commercial": scale_int(8, scale),
            "industrial": scale_int(3, scale),
            "land": scale_int(3, scale),
        },
    }


def get_timing_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate seasonal volume series for ML forecast input.
    Returns weekly/monthly volume patterns to feed timing prediction.
    Powers GET /api/v1/brokerage/analytics/timing
    """
    scale = _scale(filters)
    seasonal = [
        {"week": "2026-W01", "count": 3},
        {"week": "2026-W02", "count": 4},
        {"week": "2026-W03", "count": 2},
        {"week": "2026-W04", "count": 5},
        {"week": "2026-W05", "count": 6},
        {"week": "2026-W06", "count": 4},
        {"week": "2026-W07", "count": 7},
        {"week": "2026-W08", "count": 5},
    ]
    return {
        **_stub_meta(filters),
        "seasonal_volume": [{**row, "count": scale_int(row["count"], scale)} for row in seasonal],
        "peak_weeks": ["2026-W07", "2026-W05"],
        "forecast_note": "ML forecast pending SIL-ML integration",
    }


def get_ancillary_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Compute ancillary service attach rates and dollar leakage by agent/office.
    PRIMARY SALES DOCUMENT for SkySlope engagement — shows exact revenue
    bleeding to outside vendors that brokerage JVs could capture.

    Attach rate = % of transactions that used in-house provider for each service.
    Leakage $ = transactions using outside vendor x estimated fee per service.

    Powers GET /api/v1/brokerage/analytics/ancillary (SIL-277 URGENT)
    """
    from app.services.brokerage.ancillary_fees import ANCILLARY_FEES

    scale = _scale(filters)
    LEAKAGE_FEES = ANCILLARY_FEES
    total_transactions = scale_int(72, scale)
    by_service = [
        {
            "service": "title",
            "in_house_count": scale_int(45, scale),
            "outside_count": scale_int(27, scale),
            "attach_rate_percent": 62.5,
            "leakage_dollars": scale_int(27, scale) * LEAKAGE_FEES["title"],
            "fee_assumption": LEAKAGE_FEES["title"],
        },
        {
            "service": "lending",
            "in_house_count": scale_int(28, scale),
            "outside_count": scale_int(44, scale),
            "attach_rate_percent": 38.9,
            "leakage_dollars": scale_int(44, scale) * LEAKAGE_FEES["lending"],
            "fee_assumption": LEAKAGE_FEES["lending"],
        },
        {
            "service": "escrow",
            "in_house_count": scale_int(38, scale),
            "outside_count": scale_int(34, scale),
            "attach_rate_percent": 52.8,
            "leakage_dollars": scale_int(34, scale) * LEAKAGE_FEES["escrow"],
            "fee_assumption": LEAKAGE_FEES["escrow"],
        },
        {
            "service": "home_warranty",
            "in_house_count": scale_int(31, scale),
            "outside_count": scale_int(41, scale),
            "attach_rate_percent": 43.1,
            "leakage_dollars": scale_int(41, scale) * LEAKAGE_FEES["home_warranty"],
            "fee_assumption": LEAKAGE_FEES["home_warranty"],
        },
    ]
    total_leakage = sum(row["leakage_dollars"] for row in by_service)
    return {
        **_stub_meta(filters),
        "total_transactions": total_transactions,
        "summary": {
            "total_leakage_dollars": total_leakage,
            "avg_attach_rate_percent": 54.2,
        },
        "by_service": by_service,
        "by_agent": [
            {
                "agent_id": "stub-agent-1",
                "name": "Sarah Johnson",
                "transactions": scale_int(12, scale),
                "title_attach": 75.0,
                "lending_attach": 50.0,
                "total_leakage_dollars": scale_money(8500, scale),
            },
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "transactions": scale_int(8, scale),
                "title_attach": 37.5,
                "lending_attach": 25.0,
                "total_leakage_dollars": scale_money(14200, scale),
            },
        ],
    }


def get_funnel_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Transaction funnel — stage counts and drop-off percentages.
    Extracted from overview for dedicated route access.
    Powers GET /api/v1/brokerage/analytics/funnel
    TODO SIL-272: Validate stage names against SkySlope status field values.
    """
    date_from, date_to = _resolved_range(filters)

    FUNNEL_STAGES = ["search", "tour", "offer", "contract", "closing"]
    funnel = []
    prev_count = None
    for stage in FUNNEL_STAGES:
        count = (
            db.session.scalar(
                select(func.count(Transaction.id)).where(
                    Transaction.brokerage_org_id == filters.brokerage_org_id,
                    Transaction.status == stage,
                )
            )
            or 0
        )
        drop_off_percent = 0
        if prev_count is not None and prev_count > 0:
            drop_off_percent = round((1 - count / prev_count) * 100)
        funnel.append(
            {
                "stage": stage.capitalize(),
                "count": count,
                "drop_off_percent": drop_off_percent,
            }
        )
        prev_count = count

    result = {
        **_stub_meta(filters),
        "funnel": funnel,
    }
    # _stub_meta already has success/dates; ensure date fields match locals
    result["date_from"] = date_from.isoformat()
    result["date_to"] = date_to.isoformat()
    return result


def get_agent_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Per-agent performance metrics — throughput, stall stage, response time.
    Extracted from overview for dedicated route access.
    Powers GET /api/v1/brokerage/analytics/agents
    """
    date_from, date_to = _resolved_range(filters)

    agent_ids = _agent_ids_for_brokerage(filters.brokerage_org_id)
    agent_performance = []

    if agent_ids:
        for agent_id in agent_ids:
            agent = db.session.scalar(select(User).where(User.id == agent_id))
            if not agent:
                continue
            active_clients = (
                db.session.scalar(
                    select(func.count(Transaction.id)).where(
                        Transaction.primary_agent_id == agent_id,
                        Transaction.brokerage_org_id == filters.brokerage_org_id,
                        Transaction.status.notin_(["closed", "cancelled"]),
                    )
                )
                or 0
            )
            closings = (
                db.session.scalar(
                    select(func.count(Transaction.id)).where(
                        Transaction.primary_agent_id == agent_id,
                        Transaction.brokerage_org_id == filters.brokerage_org_id,
                        Transaction.status == "closing",
                        Transaction.updated_at >= date_from,
                        Transaction.updated_at <= date_to,
                    )
                )
                or 0
            )
            agent_performance.append(
                {
                    "agent_id": agent_id,
                    "name": agent.name,
                    "active_clients": active_clients,
                    "closings": closings,
                }
            )

    return {
        **_stub_meta(filters),
        "agents": agent_performance,
    }


def get_deal_failure_forensics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate deal fall-through and cancellation forensics for the brokerage.
    Powers GET /api/v1/brokerage/analytics/deal-failure (SIL-281)
    """
    scale = _scale(filters)
    total_transactions = scale_int(72, scale)
    total_cancelled = scale_int(11, scale)
    trend = [
        {"month": "2026-01", "total": 8, "cancelled": 1},
        {"month": "2026-02", "total": 11, "cancelled": 2},
        {"month": "2026-03", "total": 9, "cancelled": 1},
        {"month": "2026-04", "total": 14, "cancelled": 3},
        {"month": "2026-05", "total": 12, "cancelled": 2},
        {"month": "2026-06", "total": 18, "cancelled": 2},
    ]
    return {
        **_stub_meta(filters),
        "summary": {
            "total_transactions": total_transactions,
            "total_cancelled": total_cancelled,
            "fall_through_rate_percent": round(total_cancelled / total_transactions * 100, 1)
            if total_transactions
            else 0.0,
            "avg_days_to_cancellation": 18,
        },
        "trend": [
            {
                "month": row["month"],
                "total": scale_int(row["total"], scale),
                "cancelled": scale_int(row["cancelled"], scale),
            }
            for row in trend
        ],
        "by_stage": [
            {"stage": "Inspection", "count": scale_int(4, scale)},
            {"stage": "Financing", "count": scale_int(3, scale)},
            {"stage": "Appraisal", "count": scale_int(2, scale)},
            {"stage": "Title", "count": scale_int(1, scale)},
            {"stage": "Unknown", "count": scale_int(1, scale)},
        ],
        "by_agent": [
            {
                "agent_id": "stub-agent-1",
                "name": "Sarah Johnson",
                "total_deals": scale_int(12, scale),
                "cancelled": scale_int(1, scale),
                "fall_through_rate_percent": 8.3,
            },
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "total_deals": scale_int(8, scale),
                "cancelled": scale_int(3, scale),
                "fall_through_rate_percent": 37.5,
            },
            {
                "agent_id": "stub-agent-3",
                "name": "Priya Patel",
                "total_deals": scale_int(10, scale),
                "cancelled": scale_int(1, scale),
                "fall_through_rate_percent": 10.0,
            },
            {
                "agent_id": "stub-agent-4",
                "name": "James Carter",
                "total_deals": scale_int(9, scale),
                "cancelled": scale_int(4, scale),
                "fall_through_rate_percent": 44.4,
            },
        ],
        "by_lender": [
            {
                "lender_name": "Wells Fargo",
                "total_deals": scale_int(18, scale),
                "cancelled": scale_int(5, scale),
                "fall_through_rate_percent": 27.8,
            },
            {
                "lender_name": "Chase",
                "total_deals": scale_int(22, scale),
                "cancelled": scale_int(2, scale),
                "fall_through_rate_percent": 9.1,
            },
            {
                "lender_name": "Rocket Mortgage",
                "total_deals": scale_int(14, scale),
                "cancelled": scale_int(3, scale),
                "fall_through_rate_percent": 21.4,
            },
            {
                "lender_name": "Unknown / Cash",
                "total_deals": scale_int(18, scale),
                "cancelled": scale_int(1, scale),
                "fall_through_rate_percent": 5.6,
            },
        ],
        "by_price_band": [
            {
                "band": "Under $300K",
                "total_deals": scale_int(14, scale),
                "cancelled": scale_int(4, scale),
                "fall_through_rate_percent": 28.6,
            },
            {
                "band": "$300K–$500K",
                "total_deals": scale_int(28, scale),
                "cancelled": scale_int(4, scale),
                "fall_through_rate_percent": 14.3,
            },
            {
                "band": "$500K–$1M",
                "total_deals": scale_int(22, scale),
                "cancelled": scale_int(2, scale),
                "fall_through_rate_percent": 9.1,
            },
            {
                "band": "$1M+",
                "total_deals": scale_int(8, scale),
                "cancelled": scale_int(1, scale),
                "fall_through_rate_percent": 12.5,
            },
        ],
    }


def get_targeted_agent_engagement(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Identify agents with low in-house ancillary attach rates.
    Powers GET /api/v1/brokerage/analytics/targeted-agent-engagement (SIL-279)
    """
    scale = _scale(filters)
    flagged_agents = [
        {
            "agent_id": "stub-agent-2",
            "name": "Marcus Williams",
            "office": "Buckhead Office",
            "total_transactions": scale_int(8, scale),
            "attach_rates": {
                "title": 0.0,
                "lending": 25.0,
                "escrow": 37.5,
                "home_warranty": 0.0,
            },
            "quartile": "bottom",
            "service_gaps": ["title", "home_warranty"],
            "estimated_leakage_dollars": scale_money(14200, scale),
            "suggested_action": "Never used in-house title or warranty — schedule intro call with provider reps",
            "priority": "high",
        },
        {
            "agent_id": "stub-agent-4",
            "name": "James Carter",
            "office": "Midtown Office",
            "total_transactions": scale_int(9, scale),
            "attach_rates": {
                "title": 22.2,
                "lending": 0.0,
                "escrow": 44.4,
                "home_warranty": 11.1,
            },
            "quartile": "bottom",
            "service_gaps": ["lending", "home_warranty"],
            "estimated_leakage_dollars": scale_money(12800, scale),
            "suggested_action": "0% lending attach on 9 deals — share preferred lender incentive program",
            "priority": "high",
        },
        {
            "agent_id": "stub-agent-5",
            "name": "Tanya Brooks",
            "office": "Buckhead Office",
            "total_transactions": scale_int(11, scale),
            "attach_rates": {
                "title": 45.5,
                "lending": 27.3,
                "escrow": 36.4,
                "home_warranty": 18.2,
            },
            "quartile": "bottom",
            "service_gaps": ["lending", "home_warranty"],
            "estimated_leakage_dollars": scale_money(13400, scale),
            "suggested_action": "High volume, low lending and warranty attach — invite to ancillary partner lunch",
            "priority": "medium",
        },
        {
            "agent_id": "stub-agent-6",
            "name": "Derek Nguyen",
            "office": "Midtown Office",
            "total_transactions": scale_int(7, scale),
            "attach_rates": {
                "title": 28.6,
                "lending": 14.3,
                "escrow": 0.0,
                "home_warranty": 28.6,
            },
            "quartile": "bottom",
            "service_gaps": ["escrow", "lending"],
            "estimated_leakage_dollars": scale_money(8200, scale),
            "suggested_action": "Never used in-house escrow — connect with escrow coordinator directly",
            "priority": "medium",
        },
    ]
    recoverable = sum(a["estimated_leakage_dollars"] for a in flagged_agents)
    return {
        **_stub_meta(filters),
        "summary": {
            "total_agents_analyzed": 8,
            "agents_flagged": 4,
            "estimated_recoverable_dollars": recoverable,
        },
        "flagged_agents": flagged_agents,
        "by_office": [
            {
                "office": "Buckhead Office",
                "agents_flagged": 2,
                "estimated_leakage_dollars": scale_money(27600, scale),
            },
            {
                "office": "Midtown Office",
                "agents_flagged": 2,
                "estimated_leakage_dollars": scale_money(21000, scale),
            },
        ],
        "by_service_gap": [
            {"service": "lending", "agents_with_gap": 3},
            {"service": "home_warranty", "agents_with_gap": 3},
            {"service": "title", "agents_with_gap": 2},
            {"service": "escrow", "agents_with_gap": 2},
        ],
    }


def get_agent_retention_risk(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Blended ML flight-risk scores (five equal-weight factors).
    Powers GET /api/v1/brokerage/analytics/agent-retention-risk (SIL-278)
    """
    scale = _scale(filters)
    agents = [
        {
            "agent_id": "stub-agent-1",
            "name": "Sarah Johnson",
            "office": "Buckhead Office",
            "total_transactions": scale_int(12, scale),
            "estimated_gci": scale_money(186000, scale),
            "current_split_percent": 70,
            "market_benchmark_split_percent": 80,
            "split_gap": -10,
            "factor_scores": {
                "compensation": 92,
                "production_momentum": 84,
                "peer_standing": 88,
                "engagement": 80,
                "ancillary_attach": 76,
            },
            "risk_score": 84,
            "risk_tier": "flight_risk",
            "peer_production_percentile": 92,
            "recommended_action": (
                "High blended risk: compensation and peer standing leading; "
                "offer retention split review immediately"
            ),
        },
        {
            "agent_id": "stub-agent-3",
            "name": "Priya Patel",
            "office": "Buckhead Office",
            "total_transactions": scale_int(10, scale),
            "estimated_gci": scale_money(155000, scale),
            "current_split_percent": 70,
            "market_benchmark_split_percent": 75,
            "split_gap": -5,
            "factor_scores": {
                "compensation": 78,
                "production_momentum": 70,
                "peer_standing": 74,
                "engagement": 68,
                "ancillary_attach": 65,
            },
            "risk_score": 71,
            "risk_tier": "flight_risk",
            "peer_production_percentile": 85,
            "recommended_action": (
                "High blended risk across compensation and peer standing; "
                "proactive check-in recommended"
            ),
        },
        {
            "agent_id": "stub-agent-5",
            "name": "Tanya Brooks",
            "office": "Buckhead Office",
            "total_transactions": scale_int(11, scale),
            "estimated_gci": scale_money(162000, scale),
            "current_split_percent": 73,
            "market_benchmark_split_percent": 75,
            "split_gap": -2,
            "factor_scores": {
                "compensation": 56,
                "production_momentum": 50,
                "peer_standing": 54,
                "engagement": 48,
                "ancillary_attach": 52,
            },
            "risk_score": 52,
            "risk_tier": "watch",
            "peer_production_percentile": 78,
            "recommended_action": (
                "Moderate blended risk: monitor engagement and momentum; "
                "revisit at next review cycle"
            ),
        },
        {
            "agent_id": "stub-agent-6",
            "name": "Derek Nguyen",
            "office": "Midtown Office",
            "total_transactions": scale_int(7, scale),
            "estimated_gci": scale_money(98000, scale),
            "current_split_percent": 72,
            "market_benchmark_split_percent": 70,
            "split_gap": 2,
            "factor_scores": {
                "compensation": 38,
                "production_momentum": 44,
                "peer_standing": 40,
                "engagement": 42,
                "ancillary_attach": 41,
            },
            "risk_score": 41,
            "risk_tier": "watch",
            "peer_production_percentile": 55,
            "recommended_action": (
                "Moderate blended risk with improving momentum; maintain current terms"
            ),
        },
        {
            "agent_id": "stub-agent-7",
            "name": "Lisa Park",
            "office": "Midtown Office",
            "total_transactions": scale_int(9, scale),
            "estimated_gci": scale_money(134000, scale),
            "current_split_percent": 75,
            "market_benchmark_split_percent": 75,
            "split_gap": 0,
            "factor_scores": {
                "compensation": 20,
                "production_momentum": 24,
                "peer_standing": 22,
                "engagement": 20,
                "ancillary_attach": 24,
            },
            "risk_score": 22,
            "risk_tier": "stable",
            "peer_production_percentile": 70,
            "recommended_action": "Low blended risk across all factors; no action needed",
        },
        {
            "agent_id": "stub-agent-8",
            "name": "Robert Garcia",
            "office": "Buckhead Office",
            "total_transactions": scale_int(8, scale),
            "estimated_gci": scale_money(118000, scale),
            "current_split_percent": 74,
            "market_benchmark_split_percent": 70,
            "split_gap": 4,
            "factor_scores": {
                "compensation": 16,
                "production_momentum": 20,
                "peer_standing": 18,
                "engagement": 16,
                "ancillary_attach": 20,
            },
            "risk_score": 18,
            "risk_tier": "stable",
            "peer_production_percentile": 62,
            "recommended_action": "Low blended risk; stable producer, no immediate action",
        },
        {
            "agent_id": "stub-agent-2",
            "name": "Marcus Williams",
            "office": "Midtown Office",
            "total_transactions": scale_int(8, scale),
            "estimated_gci": scale_money(94000, scale),
            "current_split_percent": 80,
            "market_benchmark_split_percent": 70,
            "split_gap": 10,
            "factor_scores": {
                "compensation": 88,
                "production_momentum": 62,
                "peer_standing": 58,
                "engagement": 70,
                "ancillary_attach": 92,
            },
            "risk_score": 74,
            "risk_tier": "over_comp",
            "peer_production_percentile": 48,
            "recommended_action": (
                "Over-comp pattern: high compensation factor with weaker production; "
                "review split at next contract renewal"
            ),
        },
        {
            "agent_id": "stub-agent-4",
            "name": "James Carter",
            "office": "Midtown Office",
            "total_transactions": scale_int(4, scale),
            "estimated_gci": scale_money(52000, scale),
            "current_split_percent": 78,
            "market_benchmark_split_percent": 70,
            "split_gap": 8,
            "factor_scores": {
                "compensation": 90,
                "production_momentum": 70,
                "peer_standing": 68,
                "engagement": 82,
                "ancillary_attach": 95,
            },
            "risk_score": 81,
            "risk_tier": "over_comp",
            "peer_production_percentile": 22,
            "recommended_action": (
                "Over-comp pattern: compensation and attach elevated vs low peer standing; "
                "consider restructure"
            ),
        },
    ]
    at_risk_gci = sum(
        a["estimated_gci"] for a in agents if a["risk_tier"] in ("flight_risk", "watch")
    )
    return {
        **_stub_meta(filters),
        "methodology": (
            "Flight risk is a blended ML score (0-100) from five equal-weight factors: "
            "comp competitiveness, production momentum, peer standing, engagement, and "
            "ancillary attach. Split vs market informs the compensation factor only. "
            "Over-comp is flagged when compensation risk is high while production and "
            "peer standing are low."
        ),
        "summary": {
            "total_agents_scored": 8,
            "flight_risk_count": 2,
            "watch_count": 2,
            "stable_count": 2,
            "over_comp_count": 2,
            "estimated_at_risk_gci": at_risk_gci,
        },
        "agents": agents,
        "by_tier": [
            {
                "tier": "flight_risk",
                "count": 2,
                "estimated_gci_at_risk": scale_money(341000, scale),
            },
            {
                "tier": "watch",
                "count": 2,
                "estimated_gci_at_risk": scale_money(260000, scale),
            },
            {"tier": "stable", "count": 2, "estimated_gci_at_risk": 0},
            {"tier": "over_comp", "count": 2, "estimated_gci_at_risk": 0},
        ],
        "market_benchmarks": [
            {"tier": "Under $2M GCI", "market_split_percent": 70},
            {"tier": "$2M–$5M GCI", "market_split_percent": 75},
            {"tier": "$5M–$10M GCI", "market_split_percent": 80},
            {"tier": "Over $10M GCI", "market_split_percent": 85},
        ],
    }
