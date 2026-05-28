"""Rev-share analytics aggregation (partner-agnostic)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app import db
from app.models import BuyerStepView, Partner, RevShareLinkClick, User


@dataclass(frozen=True)
class RevShareAnalyticsFilters:
    partner_id: str
    step_id: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    agent_id: str | None = None
    brokerage: str | None = None
    bucket: str = "day"


def _click_time_bucket(bucket: str, column):
    """Postgres uses date_trunc; SQLite uses strftime for tests."""
    bind = db.session.get_bind()
    if bind.dialect.name == "sqlite":
        fmt = "%Y-%m-%d" if bucket == "day" else "%Y-%W"
        return func.strftime(fmt, column)
    return func.date_trunc(bucket, column)


def _default_range() -> tuple[datetime, datetime]:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    return start, end


def _click_base_query(filters: RevShareAnalyticsFilters, step_ids: list[str] | None = None):
    q = RevShareLinkClick.query.filter(RevShareLinkClick.partner_id == filters.partner_id)
    if filters.step_id:
        q = q.filter(RevShareLinkClick.step_id == filters.step_id)
    elif step_ids:
        q = q.filter(RevShareLinkClick.step_id.in_(step_ids))
    if filters.date_from:
        q = q.filter(RevShareLinkClick.clicked_at >= filters.date_from)
    if filters.date_to:
        q = q.filter(RevShareLinkClick.clicked_at <= filters.date_to)
    if filters.agent_id:
        q = q.filter(RevShareLinkClick.agent_id == filters.agent_id)
    if filters.brokerage:
        q = q.join(User, RevShareLinkClick.agent_id == User.id).filter(
            User.brokerage == filters.brokerage
        )
    return q


def _view_base_query(filters: RevShareAnalyticsFilters, step_ids: list[str] | None = None):
    q = BuyerStepView.query
    if filters.step_id:
        q = q.filter(BuyerStepView.step_id == filters.step_id)
    elif step_ids:
        q = q.filter(BuyerStepView.step_id.in_(step_ids))
    else:
        partner = Partner.query.filter_by(id=filters.partner_id).first()
        if partner:
            resolved = partner.resolved_step_ids()
            if resolved:
                q = q.filter(BuyerStepView.step_id.in_(resolved))
    if filters.date_from:
        q = q.filter(BuyerStepView.viewed_at >= filters.date_from)
    if filters.date_to:
        q = q.filter(BuyerStepView.viewed_at <= filters.date_to)
    return q


def get_rev_share_analytics(filters: RevShareAnalyticsFilters) -> dict:
    """
    RESPA: Aggregates placement exposure metrics for brokerage marketplace partners;
    not used for per-buyer referral compensation.
    """
    partner = Partner.query.filter_by(id=filters.partner_id).first()
    if not partner:
        return {"success": False, "error": "partner_not_found"}

    resolved_steps = partner.resolved_step_ids()

    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    click_q = _click_base_query(
        RevShareAnalyticsFilters(
            partner_id=filters.partner_id,
            step_id=filters.step_id,
            date_from=date_from,
            date_to=date_to,
            agent_id=filters.agent_id,
            brokerage=filters.brokerage,
            bucket=filters.bucket,
        ),
        step_ids=None if filters.step_id else resolved_steps,
    )

    total_clicks = click_q.count()
    unique_buyer_clicks = (
        click_q.filter(RevShareLinkClick.buyer_id.isnot(None))
        .with_entities(RevShareLinkClick.buyer_id)
        .distinct()
        .count()
    )

    view_q = _view_base_query(
        RevShareAnalyticsFilters(
            partner_id=filters.partner_id,
            step_id=filters.step_id,
            date_from=date_from,
            date_to=date_to,
        ),
        step_ids=None if filters.step_id else resolved_steps,
    )
    unique_buyer_step_views = view_q.with_entities(BuyerStepView.buyer_id).distinct().count()

    ctr: float | None = None
    if unique_buyer_step_views > 0:
        ctr = round(unique_buyer_clicks / unique_buyer_step_views, 6)

    payout = float(partner.payout_per_conversion or 0)
    payout_type = partner.payout_type or "on_click"
    if payout_type == "on_click":
        estimated_revenue = round(total_clicks * payout, 2)
    else:
        # Close attribution not wired yet — no conversion-rate estimate
        estimated_revenue = 0.0

    bucket = filters.bucket if filters.bucket in ("day", "week") else "day"
    trunc = _click_time_bucket(bucket, RevShareLinkClick.clicked_at)
    time_rows = (
        click_q.with_entities(trunc.label("bucket"), func.count(RevShareLinkClick.id))
        .group_by(trunc)
        .order_by(trunc)
        .all()
    )
    clicks_over_time = [
        {
            "date": row.bucket.date().isoformat()
            if hasattr(row.bucket, "date")
            else str(row.bucket),
            "count": row[1],
        }
        for row in time_rows
    ]

    top_agents_rows = (
        click_q.with_entities(
            RevShareLinkClick.agent_id,
            func.count(RevShareLinkClick.id).label("clicks"),
        )
        .group_by(RevShareLinkClick.agent_id)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(20)
        .all()
    )
    agent_ids = [r.agent_id for r in top_agents_rows if r.agent_id]
    agents_by_id = (
        {u.id: u for u in User.query.filter(User.id.in_(agent_ids)).all()} if agent_ids else {}
    )
    top_agents = [
        {
            "agent_id": row.agent_id,
            "name": (
                "SilverKey platform"
                if not row.agent_id
                else (
                    agents_by_id.get(row.agent_id).name
                    if agents_by_id.get(row.agent_id)
                    else row.agent_id
                )
            ),
            "clicks": row.clicks,
        }
        for row in top_agents_rows
    ]

    geo_rows = (
        click_q.with_entities(
            RevShareLinkClick.geo_city,
            RevShareLinkClick.geo_zip,
            func.count(RevShareLinkClick.id),
        )
        .group_by(RevShareLinkClick.geo_city, RevShareLinkClick.geo_zip)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(25)
        .all()
    )
    geo_breakdown = [
        {
            "city": row[0] or "Unknown",
            "zip": row[1],
            "count": row[2],
        }
        for row in geo_rows
    ]

    device_rows = (
        click_q.with_entities(
            RevShareLinkClick.device_class,
            func.count(RevShareLinkClick.id),
        )
        .group_by(RevShareLinkClick.device_class)
        .all()
    )
    device_breakdown = [{"device": row[0] or "unknown", "count": row[1]} for row in device_rows]

    referrer_rows = (
        click_q.with_entities(
            RevShareLinkClick.referrer,
            func.count(RevShareLinkClick.id),
        )
        .group_by(RevShareLinkClick.referrer)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(15)
        .all()
    )
    referrer_breakdown = [
        {"referrer": (row[0] or "direct")[:200], "count": row[1]} for row in referrer_rows
    ]

    recent = click_q.order_by(RevShareLinkClick.clicked_at.desc()).limit(50).all()
    recent_clicks = []
    for click in recent:
        buyer = User.query.filter_by(id=click.buyer_id).first() if click.buyer_id else None
        agent = User.query.filter_by(id=click.agent_id).first() if click.agent_id else None
        recent_clicks.append(
            {
                **click.to_dict(),
                "buyer_name": buyer.name if buyer else None,
                "agent_name": agent.name
                if agent
                else ("SilverKey platform" if not click.agent_id else None),
            }
        )

    return {
        "success": True,
        "partner_id": filters.partner_id,
        "total_clicks": total_clicks,
        "unique_buyer_clicks": unique_buyer_clicks,
        "unique_buyer_step_views": unique_buyer_step_views,
        "click_through_rate": ctr,
        "clicks_over_time": {"bucket": bucket, "points": clicks_over_time},
        "top_agents": top_agents,
        "geo_breakdown": geo_breakdown,
        "device_breakdown": device_breakdown,
        "referrer_breakdown": referrer_breakdown,
        "estimated_revenue": estimated_revenue,
        "estimated_revenue_label": "estimated",
        "recent_clicks": recent_clicks,
        "payout_per_conversion": payout,
        "payout_type": payout_type,
    }


def partner_list_metrics(partner_id: str, step_ids: list[str] | str) -> dict:
    """Lightweight CTR snapshot for admin partner list."""
    if isinstance(step_ids, str):
        steps = [step_ids] if step_ids else []
    else:
        steps = list(step_ids)
    filters = RevShareAnalyticsFilters(partner_id=partner_id)
    date_from, date_to = _default_range()
    filters = RevShareAnalyticsFilters(
        partner_id=partner_id,
        date_from=date_from,
        date_to=date_to,
    )
    click_q = _click_base_query(filters, step_ids=steps or None)
    total_clicks = click_q.count()
    unique_buyer_clicks = (
        click_q.filter(RevShareLinkClick.buyer_id.isnot(None))
        .with_entities(RevShareLinkClick.buyer_id)
        .distinct()
        .count()
    )
    view_q = _view_base_query(filters, step_ids=steps or None)
    unique_views = view_q.with_entities(BuyerStepView.buyer_id).distinct().count()
    ctr = None
    if unique_views > 0:
        ctr = round(unique_buyer_clicks / unique_views, 6)
    return {
        "total_clicks": total_clicks,
        "click_through_rate": ctr,
        "unique_buyer_step_views": unique_views,
    }
