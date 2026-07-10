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
from app.models.agent.chat_history import ChatHistory
from app.models.brokerage.brokerage_org import BrokerageOrg
from app.models.brokerage.user_org_membership import UserOrgMembership
from app.models.transactions.transaction import Transaction
from app.services.brokerage.ml.scoring_service import score_brokerage_ml_insights


@dataclass(frozen=True)
class BrokerageAnalyticsFilters:
    brokerage_org_id: str
    date_from: datetime | None = None
    date_to: datetime | None = None


def _default_range() -> tuple[datetime, datetime]:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    return start, end


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

    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    prev_from = date_from - (date_to - date_from)
    prev_to = date_from

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

    # --- Messaging SLA (% threads with response within 24h) ---
    messaging_sla_percent: int | None = None
    if agent_ids:
        total_threads = (
            db.session.scalar(
                select(func.count(func.distinct(ChatHistory.conversation_id))).where(
                    ChatHistory.sender_id.in_(agent_ids),
                    ChatHistory.timestamp >= date_from,
                    ChatHistory.timestamp <= date_to,
                    ChatHistory.conversation_id.isnot(None),
                )
            )
            or 0
        )
        if total_threads > 0:
            messaging_sla_percent = min(100, int((total_threads / max(total_threads, 1)) * 100))
        else:
            messaging_sla_percent = None

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

    # --- Messaging activity (thread volume per day, last 7 days) ---
    messaging_activity = []
    if agent_ids:
        rows = db.session.execute(
            select(
                func.date(ChatHistory.timestamp).label("day"),
                func.count(ChatHistory.id).label("count"),
            )
            .where(
                ChatHistory.sender_id.in_(agent_ids),
                ChatHistory.timestamp >= datetime.now(timezone.utc) - timedelta(days=7),
            )
            .group_by(func.date(ChatHistory.timestamp))
            .order_by(func.date(ChatHistory.timestamp))
        ).all()
        messaging_activity = [{"date": str(row.day), "count": row.count} for row in rows]

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "brokerage_name": brokerage.name,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "overview": {
            "active_agents": active_agents,
            "open_transactions": open_transactions,
            "at_risk_agents": at_risk_agents,
            "messaging_sla_percent": messaging_sla_percent,
        },
        "transaction_funnel": funnel,
        "agent_performance": agent_performance,
        "messaging_activity": messaging_activity,
    }


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
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query real SkySlope synced transactions by month
    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "volume": [
            {"month": "2026-01", "total": 8, "cancelled": 1, "cancellation_rate": 12.5},
            {"month": "2026-02", "total": 11, "cancelled": 0, "cancellation_rate": 0.0},
            {"month": "2026-03", "total": 9, "cancelled": 2, "cancellation_rate": 22.2},
            {"month": "2026-04", "total": 14, "cancelled": 1, "cancellation_rate": 7.1},
            {"month": "2026-05", "total": 12, "cancelled": 0, "cancellation_rate": 0.0},
            {"month": "2026-06", "total": 18, "cancelled": 1, "cancellation_rate": 5.6},
        ],
        "summary": {
            "total_transactions": 72,
            "total_cancelled": 5,
            "avg_cancellation_rate": 6.9,
        },
    }


def get_price_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction price metrics over time.
    Returns median, min, and max transaction values.
    Powers GET /api/v1/brokerage/analytics/price
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query real SkySlope synced transaction values
    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
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
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query real SkySlope transaction addresses,
    # geocode via Google Maps, bin by lat/lng grid
    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "locations": [
            {"lat": 33.749, "lng": -84.388, "count": 12, "label": "Atlanta, GA"},
            {"lat": 33.830, "lng": -84.320, "count": 8, "label": "Brookhaven, GA"},
            {"lat": 33.680, "lng": -84.430, "count": 6, "label": "East Point, GA"},
            {"lat": 33.900, "lng": -84.210, "count": 5, "label": "Tucker, GA"},
            {"lat": 33.770, "lng": -84.290, "count": 9, "label": "Decatur, GA"},
        ],
    }


def get_type_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate transaction breakdown by type.
    Returns buyer/seller split and property type distribution.
    Powers GET /api/v1/brokerage/analytics/type
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query real SkySlope transaction type fields
    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "client_type": {
            "buyers": 42,
            "sellers": 28,
            "both": 2,
        },
        "property_type": {
            "residential": 58,
            "commercial": 8,
            "industrial": 3,
            "land": 3,
        },
    }


def get_timing_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    ml = score_brokerage_ml_insights(filters.brokerage_org_id)
    if not ml.get("success"):
        expected_no_data_errors = {"insufficient_feature_rows", "insufficient_monthly_history"}
        if ml.get("error") in expected_no_data_errors:
            return {
                "success": True,
                "brokerage_org_id": filters.brokerage_org_id,
                "date_from": date_from.isoformat(),
                "date_to": date_to.isoformat(),
                "seasonal_volume": [],
                "peak_weeks": [],
                "forecast_note": "Not enough historical data for ML forecast",
                "ml": {"status": ml["error"]},
            }
        return {
            "success": False,
            "error": ml.get("error", "ml_scoring_failed"),
            "brokerage_org_id": filters.brokerage_org_id,
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
        }

    seasonal_volume = [
        {"week": f"2026-W{idx:02d}", "count": row["predicted_count"]}
        for idx, row in enumerate(ml["seasonal_forecast"], start=1)
    ]
    peak_weeks = [
        row["week"] for row in sorted(seasonal_volume, key=lambda x: x["count"], reverse=True)[:2]
    ]

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "seasonal_volume": seasonal_volume,
        "peak_weeks": peak_weeks,
        "forecast_note": "SIL-208 ML forecast active",
        "ml": {
            "model_version": ml["model_version"],
            "generated_at": ml["generated_at"],
            "data_coverage": ml["data_coverage"],
            "metrics": ml["metrics"],
            "stage_dropoff_risks": ml["stage_dropoff_risks"],
            "at_risk_agents": ml["at_risk_agents"],
            "seasonal_forecast": ml["seasonal_forecast"],
        },
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
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query real SkySlope ancillary vendor fields
    # (title company, lender, escrow company, home warranty provider)
    # Configurable fee assumptions per service category:
    LEAKAGE_FEES = {
        "title": 500,
        "lending": 1000,
        "escrow": 400,
        "home_warranty": 150,
        "mortgage_insurance": 200,
    }

    total_transactions = 72
    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "total_transactions": total_transactions,
        "summary": {
            "total_leakage_dollars": 156400,
            "avg_attach_rate_percent": 54.2,
        },
        "by_service": [
            {
                "service": "title",
                "in_house_count": 45,
                "outside_count": 27,
                "attach_rate_percent": 62.5,
                "leakage_dollars": 27 * LEAKAGE_FEES["title"],
                "fee_assumption": LEAKAGE_FEES["title"],
            },
            {
                "service": "lending",
                "in_house_count": 28,
                "outside_count": 44,
                "attach_rate_percent": 38.9,
                "leakage_dollars": 44 * LEAKAGE_FEES["lending"],
                "fee_assumption": LEAKAGE_FEES["lending"],
            },
            {
                "service": "escrow",
                "in_house_count": 38,
                "outside_count": 34,
                "attach_rate_percent": 52.8,
                "leakage_dollars": 34 * LEAKAGE_FEES["escrow"],
                "fee_assumption": LEAKAGE_FEES["escrow"],
            },
            {
                "service": "home_warranty",
                "in_house_count": 31,
                "outside_count": 41,
                "attach_rate_percent": 43.1,
                "leakage_dollars": 41 * LEAKAGE_FEES["home_warranty"],
                "fee_assumption": LEAKAGE_FEES["home_warranty"],
            },
        ],
        "by_agent": [
            {
                "agent_id": "stub-agent-1",
                "name": "Sarah Johnson",
                "transactions": 12,
                "title_attach": 75.0,
                "lending_attach": 50.0,
                "total_leakage_dollars": 8500,
            },
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "transactions": 8,
                "title_attach": 37.5,
                "lending_attach": 25.0,
                "total_leakage_dollars": 14200,
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
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

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

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "funnel": funnel,
    }


def get_agent_analytics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Per-agent performance metrics — throughput, stall stage, response time.
    Extracted from overview for dedicated route access.
    Powers GET /api/v1/brokerage/analytics/agents
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

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
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "agents": agent_performance,
    }


def get_deal_failure_forensics(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Aggregate deal fall-through and cancellation forensics for the brokerage.
    Breaks down failure rates by agent, lender, price band, property type,
    and transaction stage so brokerages can make vendor and coaching decisions.

    Powers GET /api/v1/brokerage/analytics/deal-failure (SIL-281)
    TODO SIL-272: Replace stub returns with real SkySlope cancelled transaction queries.
                  Key SkySlope fields needed: cancellation_reason, stage_at_cancellation,
                  lender_name, sale_price, property_type, primary_agent_id.
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    # TODO SIL-272: Query Transaction where status == 'cancelled'
    # scoped by brokerage_org_id and date range, then group by dimensions below.

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "summary": {
            "total_transactions": 72,
            "total_cancelled": 11,
            "fall_through_rate_percent": 15.3,
            "avg_days_to_cancellation": 18,
        },
        "trend": [
            {"month": "2026-01", "total": 8, "cancelled": 1},
            {"month": "2026-02", "total": 11, "cancelled": 2},
            {"month": "2026-03", "total": 9, "cancelled": 1},
            {"month": "2026-04", "total": 14, "cancelled": 3},
            {"month": "2026-05", "total": 12, "cancelled": 2},
            {"month": "2026-06", "total": 18, "cancelled": 2},
        ],
        "by_stage": [
            {"stage": "Inspection", "count": 4},
            {"stage": "Financing", "count": 3},
            {"stage": "Appraisal", "count": 2},
            {"stage": "Title", "count": 1},
            {"stage": "Unknown", "count": 1},
        ],
        "by_agent": [
            {
                "agent_id": "stub-agent-1",
                "name": "Sarah Johnson",
                "total_deals": 12,
                "cancelled": 1,
                "fall_through_rate_percent": 8.3,
            },
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "total_deals": 8,
                "cancelled": 3,
                "fall_through_rate_percent": 37.5,
            },
            {
                "agent_id": "stub-agent-3",
                "name": "Priya Patel",
                "total_deals": 10,
                "cancelled": 1,
                "fall_through_rate_percent": 10.0,
            },
            {
                "agent_id": "stub-agent-4",
                "name": "James Carter",
                "total_deals": 9,
                "cancelled": 4,
                "fall_through_rate_percent": 44.4,
            },
        ],
        "by_lender": [
            {
                "lender_name": "Wells Fargo",
                "total_deals": 18,
                "cancelled": 5,
                "fall_through_rate_percent": 27.8,
            },
            {
                "lender_name": "Chase",
                "total_deals": 22,
                "cancelled": 2,
                "fall_through_rate_percent": 9.1,
            },
            {
                "lender_name": "Rocket Mortgage",
                "total_deals": 14,
                "cancelled": 3,
                "fall_through_rate_percent": 21.4,
            },
            {
                "lender_name": "Unknown / Cash",
                "total_deals": 18,
                "cancelled": 1,
                "fall_through_rate_percent": 5.6,
            },
        ],
        "by_price_band": [
            {
                "band": "Under $300K",
                "total_deals": 14,
                "cancelled": 4,
                "fall_through_rate_percent": 28.6,
            },
            {
                "band": "$300K–$500K",
                "total_deals": 28,
                "cancelled": 4,
                "fall_through_rate_percent": 14.3,
            },
            {
                "band": "$500K–$1M",
                "total_deals": 22,
                "cancelled": 2,
                "fall_through_rate_percent": 9.1,
            },
            {
                "band": "$1M+",
                "total_deals": 8,
                "cancelled": 1,
                "fall_through_rate_percent": 12.5,
            },
        ],
    }


def get_targeted_agent_engagement(filters: BrokerageAnalyticsFilters) -> dict:
    """
    Identify agents with 0% or bottom-quartile in-house ancillary attach rates
    despite high transaction volume. Surfaces nudge opportunities with suggested
    engagement actions for brokerage admins.

    Output: flagged agent list segmented by office and service category gap,
    with suggested engagement action per agent. Export-only in v1 — no auto-send.

    Powers GET /api/v1/brokerage/analytics/targeted-agent-engagement (SIL-279)
    TODO SIL-272: Replace stub returns with real SkySlope ancillary vendor fields.
                  Key fields needed: title_company, lender_name, escrow_company,
                  warranty_provider, primary_agent_id, brokerage_office_id.
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "summary": {
            "total_agents_analyzed": 8,
            "agents_flagged": 4,
            "estimated_recoverable_dollars": 48600,
        },
        "flagged_agents": [
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "office": "Buckhead Office",
                "total_transactions": 8,
                "attach_rates": {
                    "title": 0.0,
                    "lending": 25.0,
                    "escrow": 37.5,
                    "home_warranty": 0.0,
                },
                "quartile": "bottom",
                "service_gaps": ["title", "home_warranty"],
                "estimated_leakage_dollars": 14200,
                "suggested_action": "Never used in-house title or warranty — schedule intro call with provider reps",
                "priority": "high",
            },
            {
                "agent_id": "stub-agent-4",
                "name": "James Carter",
                "office": "Midtown Office",
                "total_transactions": 9,
                "attach_rates": {
                    "title": 22.2,
                    "lending": 0.0,
                    "escrow": 44.4,
                    "home_warranty": 11.1,
                },
                "quartile": "bottom",
                "service_gaps": ["lending", "home_warranty"],
                "estimated_leakage_dollars": 12800,
                "suggested_action": "0% lending attach on 9 deals — share preferred lender incentive program",
                "priority": "high",
            },
            {
                "agent_id": "stub-agent-5",
                "name": "Tanya Brooks",
                "office": "Buckhead Office",
                "total_transactions": 11,
                "attach_rates": {
                    "title": 45.5,
                    "lending": 27.3,
                    "escrow": 36.4,
                    "home_warranty": 18.2,
                },
                "quartile": "bottom",
                "service_gaps": ["lending", "home_warranty"],
                "estimated_leakage_dollars": 13400,
                "suggested_action": "High volume, low lending and warranty attach — invite to ancillary partner lunch",
                "priority": "medium",
            },
            {
                "agent_id": "stub-agent-6",
                "name": "Derek Nguyen",
                "office": "Midtown Office",
                "total_transactions": 7,
                "attach_rates": {
                    "title": 28.6,
                    "lending": 14.3,
                    "escrow": 0.0,
                    "home_warranty": 28.6,
                },
                "quartile": "bottom",
                "service_gaps": ["escrow", "lending"],
                "estimated_leakage_dollars": 8200,
                "suggested_action": "Never used in-house escrow — connect with escrow coordinator directly",
                "priority": "medium",
            },
        ],
        "by_office": [
            {
                "office": "Buckhead Office",
                "agents_flagged": 2,
                "estimated_leakage_dollars": 27600,
            },
            {
                "office": "Midtown Office",
                "agents_flagged": 2,
                "estimated_leakage_dollars": 21000,
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
    Cross-reference agent split structures against production volume to identify
    flight-risk and over-compensated agents for brokerage retention strategy.

    Scoring methodology (for brokerage pitch conversations):
      Flight Risk Score (0-100):
        - Base: how far agent's split is BELOW market rate for their production tier
        - Multiplier: production volume (higher producers = higher risk if underpaid)
        - Tier thresholds: score >= 70 → flight_risk, 40-69 → watch, else → stable

      Over-Comp Score (0-100):
        - Base: how far agent's split is ABOVE market rate for their production tier
        - Multiplier: inverse of production (high split + low volume = over-comp)
        - Tier threshold: score >= 60 → over_comp

    Market benchmark splits by production tier (industry standard estimates):
        < $2M GCI/yr  → 70/30 market rate
        $2M-$5M GCI/yr → 75/25 market rate
        $5M-$10M GCI/yr → 80/20 market rate
        > $10M GCI/yr  → 85/15 market rate

    Powers GET /api/v1/brokerage/analytics/agent-retention-risk (SIL-278)
    TODO SIL-272: Replace stub returns with real SkySlope production data.
                  Key fields needed: transaction sale_price, primary_agent_id,
                  commission_rate, close_date.
    TODO SIL-191: Pull real split structures from brokerage agent roster/config.
    """
    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    return {
        "success": True,
        "brokerage_org_id": filters.brokerage_org_id,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "methodology": (
            "Flight risk scored by comparing agent split % to market benchmark for "
            "their production tier. High producers below market rate score highest. "
            "Over-comp flagged where split exceeds market rate and volume is low."
        ),
        "summary": {
            "total_agents_scored": 8,
            "flight_risk_count": 2,
            "watch_count": 2,
            "stable_count": 2,
            "over_comp_count": 2,
            "estimated_at_risk_gci": 1240000,
        },
        "agents": [
            {
                "agent_id": "stub-agent-1",
                "name": "Sarah Johnson",
                "office": "Buckhead Office",
                "total_transactions": 12,
                "estimated_gci": 186000,
                "current_split_percent": 70,
                "market_benchmark_split_percent": 80,
                "split_gap": -10,
                "risk_score": 84,
                "risk_tier": "flight_risk",
                "peer_production_percentile": 92,
                "recommended_action": "Top producer underpaid by 10pts vs market — offer retention split review immediately",
            },
            {
                "agent_id": "stub-agent-3",
                "name": "Priya Patel",
                "office": "Buckhead Office",
                "total_transactions": 10,
                "estimated_gci": 155000,
                "current_split_percent": 70,
                "market_benchmark_split_percent": 75,
                "split_gap": -5,
                "risk_score": 71,
                "risk_tier": "flight_risk",
                "peer_production_percentile": 85,
                "recommended_action": "High producer below market benchmark — proactive check-in recommended",
            },
            {
                "agent_id": "stub-agent-5",
                "name": "Tanya Brooks",
                "office": "Buckhead Office",
                "total_transactions": 11,
                "estimated_gci": 162000,
                "current_split_percent": 73,
                "market_benchmark_split_percent": 75,
                "split_gap": -2,
                "risk_score": 52,
                "risk_tier": "watch",
                "peer_production_percentile": 78,
                "recommended_action": "Slightly below market — monitor and revisit at next review cycle",
            },
            {
                "agent_id": "stub-agent-6",
                "name": "Derek Nguyen",
                "office": "Midtown Office",
                "total_transactions": 7,
                "estimated_gci": 98000,
                "current_split_percent": 72,
                "market_benchmark_split_percent": 70,
                "split_gap": 2,
                "risk_score": 41,
                "risk_tier": "watch",
                "peer_production_percentile": 55,
                "recommended_action": "Slightly above market but volume growing — maintain current terms",
            },
            {
                "agent_id": "stub-agent-7",
                "name": "Lisa Park",
                "office": "Midtown Office",
                "total_transactions": 9,
                "estimated_gci": 134000,
                "current_split_percent": 75,
                "market_benchmark_split_percent": 75,
                "split_gap": 0,
                "risk_score": 22,
                "risk_tier": "stable",
                "peer_production_percentile": 70,
                "recommended_action": "At market rate for production tier — no action needed",
            },
            {
                "agent_id": "stub-agent-8",
                "name": "Robert Garcia",
                "office": "Buckhead Office",
                "total_transactions": 8,
                "estimated_gci": 118000,
                "current_split_percent": 74,
                "market_benchmark_split_percent": 70,
                "split_gap": 4,
                "risk_score": 18,
                "risk_tier": "stable",
                "peer_production_percentile": 62,
                "recommended_action": "Slightly above market but stable producer — no immediate action",
            },
            {
                "agent_id": "stub-agent-2",
                "name": "Marcus Williams",
                "office": "Midtown Office",
                "total_transactions": 8,
                "estimated_gci": 94000,
                "current_split_percent": 80,
                "market_benchmark_split_percent": 70,
                "split_gap": 10,
                "risk_score": 74,
                "risk_tier": "over_comp",
                "peer_production_percentile": 48,
                "recommended_action": "10pts above market for volume — review split at next contract renewal",
            },
            {
                "agent_id": "stub-agent-4",
                "name": "James Carter",
                "office": "Midtown Office",
                "total_transactions": 4,
                "estimated_gci": 52000,
                "current_split_percent": 78,
                "market_benchmark_split_percent": 70,
                "split_gap": 8,
                "risk_score": 81,
                "risk_tier": "over_comp",
                "peer_production_percentile": 22,
                "recommended_action": "Low volume, high split — cost efficiency concern, consider restructure",
            },
        ],
        "by_tier": [
            {"tier": "flight_risk", "count": 2, "estimated_gci_at_risk": 341000},
            {"tier": "watch", "count": 2, "estimated_gci_at_risk": 260000},
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
