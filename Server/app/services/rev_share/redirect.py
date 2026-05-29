"""Rev-share redirect: log click and resolve destination URL."""

from __future__ import annotations

from dataclasses import dataclass

from app import db
from app.models import Partner, RevShareLink, RevShareLinkClick, User
from app.services.rev_share.device import classify_device
from app.services.rev_share.geo_ip import lookup_geo_for_ip
from app.services.rev_share.ip_hash import hash_client_ip
from app.services.rev_share.transaction_resolve import resolve_transaction
from app.services.rev_share.url_template import append_query_params, interpolate_destination_url
from logger import LOG_CATEGORIES, log


@dataclass(frozen=True)
class RedirectClickContext:
    buyer_id: str | None
    transaction_id: str | None
    step_id: str | None
    ip_address: str | None
    user_agent: str | None
    referrer: str | None
    utm_source: str | None
    utm_medium: str | None
    utm_campaign: str | None
    extra_query: dict[str, str] | None = None


def _resolve_link(link_id: str) -> tuple[RevShareLink, Partner] | None:
    link = RevShareLink.query.filter_by(id=link_id, is_active=True).first()
    if not link:
        return None
    partner = Partner.query.filter_by(id=link.partner_id, is_active=True).first()
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
    """Map request ids to FK-safe buyer_id / transactions.id (path may use buyer subject id)."""
    tx = resolve_transaction(ctx.transaction_id) if ctx.transaction_id else None
    if tx:
        return tx.buyer_id, tx.id
    buyer_id = (ctx.buyer_id or "").strip() or None
    if buyer_id and User.query.filter_by(id=buyer_id).first():
        return buyer_id, None
    return None, None


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
    geo = lookup_geo_for_ip(ctx.ip_address)
    device = classify_device(ctx.user_agent)

    click = RevShareLinkClick(
        partner_id=partner.id,
        link_id=link.id,
        agent_id=None,
        buyer_id=buyer_id,
        transaction_id=transaction_id,
        step_id=step_id,
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
    db.session.add(click)
    db.session.commit()

    log.info(
        LOG_CATEGORIES["SECURITY"],
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
