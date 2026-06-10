"""Rev-share analytics aggregation (partner-agnostic)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app import db
from app.dtos.partner import RevShareLinkClickDTO
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


def _click_base_select(filters: RevShareAnalyticsFilters, step_ids: list[str] | None = None):
    stmt = select(RevShareLinkClick).where(RevShareLinkClick.partner_id == filters.partner_id)
    if filters.step_id:
        stmt = stmt.where(RevShareLinkClick.step_id == filters.step_id)
    elif step_ids:
        stmt = stmt.where(RevShareLinkClick.step_id.in_(step_ids))
    if filters.date_from:
        stmt = stmt.where(RevShareLinkClick.clicked_at >= filters.date_from)
    if filters.date_to:
        stmt = stmt.where(RevShareLinkClick.clicked_at <= filters.date_to)
    if filters.agent_id:
        stmt = stmt.where(RevShareLinkClick.agent_id == filters.agent_id)
    if filters.brokerage:
        from app.models import Transaction
        from app.models.brokerage import BrokerageOrg

        stmt = (
            stmt.join(Transaction, RevShareLinkClick.transaction_id == Transaction.id)
            .join(BrokerageOrg, Transaction.brokerage_org_id == BrokerageOrg.id)
            .where(
                (BrokerageOrg.slug == filters.brokerage) | (BrokerageOrg.name == filters.brokerage)
            )
        )
    return stmt


def _view_base_select(filters: RevShareAnalyticsFilters, step_ids: list[str] | None = None):
    stmt = select(BuyerStepView)
    if filters.step_id:
        stmt = stmt.where(BuyerStepView.step_id == filters.step_id)
    elif step_ids:
        stmt = stmt.where(BuyerStepView.step_id.in_(step_ids))
    else:
        partner = db.session.scalar(select(Partner).where(Partner.id == filters.partner_id))
        if partner:
            resolved = partner.resolved_step_ids()
            if resolved:
                stmt = stmt.where(BuyerStepView.step_id.in_(resolved))
    if filters.date_from:
        stmt = stmt.where(BuyerStepView.viewed_at >= filters.date_from)
    if filters.date_to:
        stmt = stmt.where(BuyerStepView.viewed_at <= filters.date_to)
    return stmt


def get_rev_share_analytics(filters: RevShareAnalyticsFilters) -> dict:
    """
    RESPA: Aggregates placement exposure metrics for brokerage marketplace partners;
    not used for per-buyer referral compensation.
    """
    partner = db.session.scalar(select(Partner).where(Partner.id == filters.partner_id))
    if not partner:
        return {"success": False, "error": "partner_not_found"}

    resolved_steps = partner.resolved_step_ids()

    date_from = filters.date_from
    date_to = filters.date_to
    if not date_from or not date_to:
        date_from, date_to = _default_range()

    scoped_filters = RevShareAnalyticsFilters(
        partner_id=filters.partner_id,
        step_id=filters.step_id,
        date_from=date_from,
        date_to=date_to,
        agent_id=filters.agent_id,
        brokerage=filters.brokerage,
        bucket=filters.bucket,
    )
    step_filter = None if filters.step_id else resolved_steps

    click_sel = _click_base_select(scoped_filters, step_ids=step_filter)
    click_subq = click_sel.subquery()
    click_entity = click_subq.c

    total_clicks = db.session.scalar(select(func.count()).select_from(click_subq)) or 0
    unique_buyer_clicks = (
        db.session.scalar(
            select(func.count(func.distinct(click_entity.buyer_id)))
            .select_from(click_subq)
            .where(click_entity.buyer_id.isnot(None))
        )
        or 0
    )

    view_sel = _view_base_select(
        RevShareAnalyticsFilters(
            partner_id=filters.partner_id,
            step_id=filters.step_id,
            date_from=date_from,
            date_to=date_to,
        ),
        step_ids=step_filter,
    )
    view_subq = view_sel.subquery()
    unique_buyer_step_views = (
        db.session.scalar(
            select(func.count(func.distinct(view_subq.c.buyer_id))).select_from(view_subq)
        )
        or 0
    )

    ctr: float | None = None
    if unique_buyer_step_views > 0:
        ctr = round(unique_buyer_clicks / unique_buyer_step_views, 6)

    payout = float(partner.payout_per_conversion or 0)
    payout_type = partner.payout_type or "on_click"
    if payout_type == "on_click":
        revenue_sum = db.session.scalar(
            select(func.coalesce(func.sum(click_entity.payout_per_conversion), 0))
            .select_from(click_subq)
            .where(click_entity.payout_type == "on_click")
        )
        estimated_revenue = round(float(revenue_sum or 0), 2)
    else:
        estimated_revenue = 0.0

    bucket = filters.bucket if filters.bucket in ("day", "week") else "day"
    trunc = _click_time_bucket(bucket, RevShareLinkClick.clicked_at)
    time_rows = db.session.execute(
        select(trunc.label("bucket"), func.count(RevShareLinkClick.id))
        .select_from(RevShareLinkClick)
        .where(
            RevShareLinkClick.id.in_(select(click_subq.c.id)),
        )
        .group_by(trunc)
        .order_by(trunc)
    ).all()
    clicks_over_time = [
        {
            "date": row.bucket.date().isoformat()
            if hasattr(row.bucket, "date")
            else str(row.bucket),
            "count": row[1],
        }
        for row in time_rows
    ]

    top_agents_rows = db.session.execute(
        select(
            RevShareLinkClick.agent_id,
            func.count(RevShareLinkClick.id).label("clicks"),
        )
        .where(RevShareLinkClick.id.in_(select(click_subq.c.id)))
        .group_by(RevShareLinkClick.agent_id)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(20)
    ).all()
    agent_ids = [r.agent_id for r in top_agents_rows if r.agent_id]
    agents_by_id = (
        {u.id: u for u in db.session.scalars(select(User).where(User.id.in_(agent_ids))).all()}
        if agent_ids
        else {}
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

    geo_rows = db.session.execute(
        select(
            RevShareLinkClick.geo_city,
            RevShareLinkClick.geo_zip,
            func.count(RevShareLinkClick.id),
        )
        .where(RevShareLinkClick.id.in_(select(click_subq.c.id)))
        .group_by(RevShareLinkClick.geo_city, RevShareLinkClick.geo_zip)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(25)
    ).all()
    geo_breakdown = [
        {
            "city": row[0] or "Unknown",
            "zip": row[1],
            "count": row[2],
        }
        for row in geo_rows
    ]

    device_rows = db.session.execute(
        select(
            RevShareLinkClick.device_class,
            func.count(RevShareLinkClick.id),
        )
        .where(RevShareLinkClick.id.in_(select(click_subq.c.id)))
        .group_by(RevShareLinkClick.device_class)
    ).all()
    device_breakdown = [{"device": row[0] or "unknown", "count": row[1]} for row in device_rows]

    referrer_rows = db.session.execute(
        select(
            RevShareLinkClick.referrer,
            func.count(RevShareLinkClick.id),
        )
        .where(RevShareLinkClick.id.in_(select(click_subq.c.id)))
        .group_by(RevShareLinkClick.referrer)
        .order_by(func.count(RevShareLinkClick.id).desc())
        .limit(15)
    ).all()
    referrer_breakdown = [
        {"referrer": (row[0] or "direct")[:200], "count": row[1]} for row in referrer_rows
    ]

    recent = db.session.scalars(
        click_sel.order_by(RevShareLinkClick.clicked_at.desc()).limit(50)
    ).all()
    recent_clicks = []
    for click in recent:
        buyer = (
            db.session.scalar(select(User).where(User.id == click.buyer_id))
            if click.buyer_id
            else None
        )
        agent = (
            db.session.scalar(select(User).where(User.id == click.agent_id))
            if click.agent_id
            else None
        )
        agent_fallback = "SilverKey platform" if not click.agent_id else None
        recent_clicks.append(
            RevShareLinkClickDTO.to_recent_click(
                click,
                buyer=buyer,
                agent=agent,
                agent_display_fallback=agent_fallback,
            )
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
    date_from, date_to = _default_range()
    filters = RevShareAnalyticsFilters(
        partner_id=partner_id,
        date_from=date_from,
        date_to=date_to,
    )
    click_sel = _click_base_select(filters, step_ids=steps or None)
    click_subq = click_sel.subquery()
    total_clicks = db.session.scalar(select(func.count()).select_from(click_subq)) or 0
    unique_buyer_clicks = (
        db.session.scalar(
            select(func.count(func.distinct(click_subq.c.buyer_id)))
            .select_from(click_subq)
            .where(click_subq.c.buyer_id.isnot(None))
        )
        or 0
    )
    view_sel = _view_base_select(filters, step_ids=steps or None)
    view_subq = view_sel.subquery()
    unique_views = (
        db.session.scalar(
            select(func.count(func.distinct(view_subq.c.buyer_id))).select_from(view_subq)
        )
        or 0
    )
    ctr = None
    if unique_views > 0:
        ctr = round(unique_buyer_clicks / unique_views, 6)
    return {
        "total_clicks": total_clicks,
        "click_through_rate": ctr,
        "unique_buyer_step_views": unique_views,
    }
