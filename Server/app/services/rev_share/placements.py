"""Buyer-facing partner placements for a checklist step."""

from __future__ import annotations

from app.models import Partner, RevShareLink
from app.models.partners.partner import CHECKLIST_WORKSPACES, DEFAULT_INTEGRATION_DISPLAY_MODE
from app.services.rev_share.admin.partner_logo import enrich_partner_dict_logo
from app.services.rev_share.link_provisioning import ensure_link_for_partner
from app.services.rev_share.partner_steps import list_active_partners_for_step
from app.services.transactions.lookup import get_transaction_by_id

from .url_template import interpolate_destination_url


def _resolve_destination_url(
    *,
    partner: Partner,
    link: RevShareLink,
    transaction_id: str | None,
) -> str:
    tx = get_transaction_by_id(transaction_id) if transaction_id else None
    return interpolate_destination_url(
        partner.destination_url_template,
        link_id=link.id,
        buyer_id=tx.buyer_id if tx else None,
        transaction_id=tx.id if tx else None,
        partner_slug=partner.slug,
    )


def _resolve_embed_src(
    *,
    partner: Partner,
    link: RevShareLink,
    transaction_id: str | None,
) -> str | None:
    mode = partner.integration_display_mode or DEFAULT_INTEGRATION_DISPLAY_MODE
    if mode != "iframe_and_link":
        return None
    template = (partner.embed_url_template or partner.destination_url_template or "").strip()
    if not template:
        return None
    tx = get_transaction_by_id(transaction_id) if transaction_id else None
    return interpolate_destination_url(
        template,
        link_id=link.id,
        buyer_id=tx.buyer_id if tx else None,
        transaction_id=tx.id if tx else None,
        partner_slug=partner.slug,
    )


def get_placements_for_step(
    *,
    step_id: str,
    workspace: str | None = None,
    transaction_id: str | None = None,
) -> list[dict]:
    """
    RESPA: Returns brokerage-configured active partners for a workflow step with the
    platform attribution link id (SilverKey ↔ partner placement, not agent referral).
    """
    if workspace and workspace not in CHECKLIST_WORKSPACES:
        return []

    out: list[dict] = []
    for partner in list_active_partners_for_step(step_id):
        target_roles = list(partner.target_roles or [])
        if workspace and workspace not in target_roles:
            continue
        if not target_roles:
            continue

        ensure_link_for_partner(partner.id)
        link = RevShareLink.query.filter_by(partner_id=partner.id, is_active=True).first()
        if not link:
            continue
        out.append(
            {
                "partner": enrich_partner_dict_logo(partner.to_dict()),
                "link_id": link.id,
                "destination_url": _resolve_destination_url(
                    partner=partner,
                    link=link,
                    transaction_id=transaction_id,
                ),
                "embed_src": _resolve_embed_src(
                    partner=partner,
                    link=link,
                    transaction_id=transaction_id,
                ),
            }
        )
    return out
