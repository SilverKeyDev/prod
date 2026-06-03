"""Rev-share redirect: log click and resolve destination URL."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import Partner, RevShareLink, RevShareLinkClick, User
from app.services.rev_share.device import classify_device
from app.services.rev_share.geo_ip import lookup_geo_for_ip
from app.services.rev_share.ip_hash import hash_client_ip
from app.services.rev_share.url_template import append_query_params, interpolate_destination_url
from app.services.transactions.lookup import get_transaction_by_id
from logger import log


@dataclass(frozen=True)
class RedirectClickContext:
    buyer_id: str | None
    transaction_id: str | None
    step_id: str | None
    session_id: str | None
    ip_address: str | None
    user_agent: str | None
    referrer: str | None
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    extra_query: dict[str, str] | None = None


def _normalize_session_id(session_id: str | None) -> str | None:
    if not session_id:
        return None
    cleaned = session_id.strip()[:64]
    return cleaned or None


def _resolve_link(link_id: str) -> tuple[RevShareLink, Partner] | None:
    link = db.session.scalar(
        select(RevShareLink).where(RevShareLink.id == link_id, RevShareLink.is_active.is_(True))
    )
    if not link:
        return None
    partner = db.session.scalar(
        select(Partner).where(Partner.id == link.partner_id, Partner.is_active.is_(True))
    )
    if not partner:
        return None
    return link, partner


def build_redirect_destination(link_id: str, ctx: RedirectClickContext) -> str | None:
    """Interpolate destination without persisting a click (preview / tests)."""
    resolved = _resolve_link(link_id)
    if not resolved:
        return None
    link, partner = resolved
    destination = interpolate_destination_url(
        partner.destination_url_template,
        link_id=link.id,
        buyer_id=ctx.buyer_id,
        transaction_id=ctx.transaction_id,
        partner_slug=partner.slug,
        extra=ctx.extra_query,
    )
    if ctx.extra_query:
        destination = append_query_params(destination, ctx.extra_query)
    return destination


def _click_attribution_ids(ctx: RedirectClickContext) -> tuple[str | None, str | None]:
    """Map request ids to FK-safe buyer_id / transactions.id."""
    tx = get_transaction_by_id(ctx.transaction_id) if ctx.transaction_id else None
    if tx:
        return tx.buyer_id, tx.id
    buyer_id = (ctx.buyer_id or "").strip() or None
    if buyer_id and db.session.scalar(select(User).where(User.id == buyer_id)):
        return buyer_id, None
    return None, None


def _build_click_row(
    *,
    link: RevShareLink,
    partner: Partner,
    ctx: RedirectClickContext,
    buyer_id: str | None,
    transaction_id: str | None,
    step_id: str,
    session_id: str | None,
    click_date: date,
    geo,
    device: str,
) -> RevShareLinkClick:
    return RevShareLinkClick(
        partner_id=partner.id,
        link_id=link.id,
        agent_id=None,
        buyer_id=buyer_id,
        transaction_id=transaction_id,
        step_id=step_id,
        payout_per_conversion=partner.payout_per_conversion,
        payout_type=partner.payout_type or "on_click",
        session_id=session_id,
        click_date=click_date,
        ip_address_hash=hash_client_ip(ctx.ip_address),
        user_agent=(ctx.user_agent or "")[:2000] if ctx.user_agent else None,
        referrer=(ctx.referrer or "")[:2000] if ctx.referrer else None,
        utm_source=ctx.utm_source,
        utm_medium=ctx.utm_medium,
        utm_campaign=ctx.utm_campaign,
        geo_city=geo.city,
        geo_zip=geo.zip_code,
        geo_region=geo.region,
        device_class=device,
    )


def _find_or_create_click(
    *,
    link: RevShareLink,
    partner: Partner,
    ctx: RedirectClickContext,
    buyer_id: str | None,
    transaction_id: str | None,
    step_id: str,
) -> tuple[RevShareLinkClick | None, bool]:
    """Returns (click_row, created). created=False when deduped or on race."""
    session_id = _normalize_session_id(ctx.session_id)
    now = datetime.now(timezone.utc)
    click_date = now.date()

    if session_id:
        existing = db.session.scalar(
            select(RevShareLinkClick).where(
                RevShareLinkClick.link_id == link.id,
                RevShareLinkClick.session_id == session_id,
                RevShareLinkClick.click_date == click_date,
            )
        )
        if existing:
            return existing, False

    geo = lookup_geo_for_ip(ctx.ip_address)
    device = classify_device(ctx.user_agent)
    click = _build_click_row(
        link=link,
        partner=partner,
        ctx=ctx,
        buyer_id=buyer_id,
        transaction_id=transaction_id,
        step_id=step_id,
        session_id=session_id,
        click_date=click_date,
        geo=geo,
        device=device,
    )
    db.session.add(click)
    try:
        db.session.commit()
        return click, True
    except IntegrityError:
        db.session.rollback()
        if session_id:
            existing = db.session.scalar(
                select(RevShareLinkClick).where(
                    RevShareLinkClick.link_id == link.id,
                    RevShareLinkClick.session_id == session_id,
                    RevShareLinkClick.click_date == click_date,
                )
            )
            if existing:
                return existing, False
        return None, False


def record_click_and_get_destination(link_id: str, ctx: RedirectClickContext) -> str | None:
    """
    RESPA: Brokerage-configured partner placement; outbound click is logged for platform
    analytics, not an agent referral fee. Partner pays for placement access.
    """
    resolved = _resolve_link(link_id)
    if not resolved:
        return None
    link, partner = resolved

    step_id = (ctx.step_id or partner.step_id or "").strip() or partner.step_id
    buyer_id, transaction_id = _click_attribution_ids(ctx)

    click, created = _find_or_create_click(
        link=link,
        partner=partner,
        ctx=ctx,
        buyer_id=buyer_id,
        transaction_id=transaction_id,
        step_id=step_id,
    )

    if created and click is not None:
        log.info(
            "SECURITY",
            "rev_share_click",
            {
                "partner_slug": partner.slug,
                "link_id": link.id,
                "step_id": step_id,
                "transaction_id": transaction_id,
                "has_buyer": bool(buyer_id),
            },
        )

        from app.services.analytics.posthog_events import capture_product_event

        distinct_id = str(ctx.buyer_id) if ctx.buyer_id else f"rev_share:{link.id}"
        capture_product_event(
            distinct_id,
            "partner_link_clicked",
            properties={
                "partner_slug": partner.slug,
                "step_id": step_id,
                "link_id": link.id,
            },
        )

    destination = interpolate_destination_url(
        partner.destination_url_template,
        link_id=link.id,
        buyer_id=buyer_id,
        transaction_id=transaction_id,
        partner_slug=partner.slug,
        extra=ctx.extra_query,
    )
    if ctx.extra_query:
        destination = append_query_params(destination, ctx.extra_query)
    return destination
