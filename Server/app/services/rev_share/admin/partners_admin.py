"""Admin CRUD for rev-share partners."""

from __future__ import annotations

import re
from decimal import Decimal

from sqlalchemy import delete, select

from app import db
from app.dtos.partner import PartnerDTO
from app.models import Partner, RevShareLink, RevShareLinkClick
from app.models.partners.partner import CHECKLIST_WORKSPACES
from app.services.rev_share.admin.partner_logo import (
    _SKIP_LOGO_UPDATE,
    coerce_logo_url_for_storage,
    delete_stored_partner_logo,
    enrich_partner_dict_logo,
)
from app.services.rev_share.admin.partner_validation import (
    normalize_integration_display_mode,
    normalize_payout_type,
    normalize_step_ids,
    normalize_target_roles,
    sync_step_id_from_step_ids,
    validate_partner_fields,
)
from app.services.rev_share.analytics import partner_list_metrics
from app.services.rev_share.link_provisioning import ensure_links_for_partner
from app.services.rev_share.url_template import validate_template_placeholders

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _stored_logo_from_payload(value: object | None) -> str | None:
    stored = coerce_logo_url_for_storage(value)
    if stored is _SKIP_LOGO_UPDATE:
        return None
    return stored  # type: ignore[return-value]


def _parse_decimal(value, default: str = "0") -> Decimal:
    if value is None:
        return Decimal(default)
    return Decimal(str(value))


def _partner_row(partner: Partner) -> dict:
    metrics = partner_list_metrics(partner.id, partner.resolved_step_ids())
    row = enrich_partner_dict_logo(PartnerDTO.to_response(partner))
    row.update(metrics)
    return row


def list_partners() -> list[dict]:
    partners = db.session.scalars(select(Partner).order_by(Partner.name)).all()
    return [_partner_row(p) for p in partners]


def get_partner(partner_id: str) -> dict | None:
    p = db.session.scalar(select(Partner).where(Partner.id == partner_id))
    if not p:
        return None
    return _partner_row(p)


def create_partner(payload: dict) -> tuple[dict | None, str | None]:
    slug = (payload.get("slug") or "").strip().lower()
    if not _SLUG_RE.match(slug):
        return None, "invalid_slug"
    if db.session.scalar(select(Partner).where(Partner.slug == slug)):
        return None, "slug_exists"

    unknown = validate_template_placeholders(payload.get("destination_url_template") or "")
    if unknown:
        return None, f"unknown_placeholders:{','.join(unknown)}"

    target_roles = normalize_target_roles(payload.get("target_roles"))
    if not target_roles:
        return None, "invalid_target_roles"

    step_ids = normalize_step_ids(payload.get("step_ids") or [])
    if payload.get("step_ids") is not None and step_ids is None:
        return None, "invalid_step_ids"

    payout_type = normalize_payout_type(payload.get("payout_type") or "on_click")
    if not payout_type:
        return None, "invalid_payout_type"

    integration_display_mode = normalize_integration_display_mode(
        payload.get("integration_display_mode")
    )
    embed_url_template = (payload.get("embed_url_template") or "").strip() or None
    if embed_url_template:
        unknown_embed = validate_template_placeholders(embed_url_template)
        if unknown_embed:
            return None, f"unknown_placeholders:{','.join(unknown_embed)}"

    err = validate_partner_fields(
        target_roles=target_roles,
        step_ids=step_ids or [],
        payout_type=payout_type,
        destination_url_template=(payload.get("destination_url_template") or "").strip(),
        name=(payload.get("name") or "").strip(),
    )
    if err:
        return None, err

    step_ids = step_ids or []
    if CHECKLIST_WORKSPACES.intersection(target_roles) and not step_ids:
        return None, "missing_step_ids"

    primary_step = sync_step_id_from_step_ids(step_ids) or "n/a"
    partner = Partner(
        name=(payload.get("name") or "").strip(),
        slug=slug,
        destination_url_template=(payload.get("destination_url_template") or "").strip(),
        logo_url=_stored_logo_from_payload(payload.get("logo_url")),
        description=(payload.get("description") or "").strip() or None,
        step_id=primary_step,
        step_ids=step_ids,
        target_roles=target_roles,
        payout_type=payout_type,
        payout_per_conversion=_parse_decimal(payload.get("payout_per_conversion")),
        integration_display_mode=integration_display_mode,
        embed_url_template=embed_url_template,
        is_active=True,
    )
    if not partner.name or not partner.destination_url_template:
        return None, "missing_required_fields"

    db.session.add(partner)
    db.session.commit()
    ensure_links_for_partner(partner.id)
    return _partner_row(partner), None


def update_partner(partner_id: str, payload: dict) -> tuple[dict | None, str | None]:
    partner = db.session.scalar(select(Partner).where(Partner.id == partner_id))
    if not partner:
        return None, "not_found"

    if "slug" in payload:
        slug = (payload.get("slug") or "").strip().lower()
        if not _SLUG_RE.match(slug):
            return None, "invalid_slug"
        existing = db.session.scalar(
            select(Partner).where(Partner.slug == slug, Partner.id != partner_id)
        )
        if existing:
            return None, "slug_exists"
        partner.slug = slug

    if "destination_url_template" in payload:
        template = (payload.get("destination_url_template") or "").strip()
        unknown = validate_template_placeholders(template)
        if unknown:
            return None, f"unknown_placeholders:{','.join(unknown)}"
        partner.destination_url_template = template

    for field in ("name", "description"):
        if field in payload:
            val = payload.get(field)
            if field == "name":
                partner.name = (val or "").strip()
            else:
                setattr(partner, field, (val or "").strip() or None)

    if "logo_url" in payload:
        stored = coerce_logo_url_for_storage(payload.get("logo_url"))
        if stored is not _SKIP_LOGO_UPDATE:
            partner.logo_url = stored  # type: ignore[assignment]

    target_roles = partner.target_roles or []
    if "target_roles" in payload:
        normalized = normalize_target_roles(payload.get("target_roles"))
        if not normalized:
            return None, "invalid_target_roles"
        target_roles = normalized
        partner.target_roles = target_roles

    step_ids = partner.resolved_step_ids()
    if "step_ids" in payload:
        normalized = normalize_step_ids(payload.get("step_ids"))
        if normalized is None:
            return None, "invalid_step_ids"
        step_ids = normalized
        partner.step_ids = step_ids
        partner.step_id = sync_step_id_from_step_ids(step_ids) or "n/a"

    if "payout_type" in payload:
        payout_type = normalize_payout_type(payload.get("payout_type"))
        if not payout_type:
            return None, "invalid_payout_type"
        partner.payout_type = payout_type
    else:
        payout_type = partner.payout_type

    if "payout_per_conversion" in payload:
        partner.payout_per_conversion = _parse_decimal(payload.get("payout_per_conversion"))

    if "integration_display_mode" in payload:
        partner.integration_display_mode = normalize_integration_display_mode(
            payload.get("integration_display_mode")
        )

    if "embed_url_template" in payload:
        embed_template = (payload.get("embed_url_template") or "").strip() or None
        if embed_template:
            unknown_embed = validate_template_placeholders(embed_template)
            if unknown_embed:
                return None, f"unknown_placeholders:{','.join(unknown_embed)}"
        partner.embed_url_template = embed_template

    err = validate_partner_fields(
        target_roles=target_roles,
        step_ids=step_ids,
        payout_type=payout_type,
        name=partner.name,
        destination_url_template=partner.destination_url_template,
    )
    if err:
        return None, err

    if "is_active" in payload:
        was_active = partner.is_active
        partner.is_active = bool(payload.get("is_active"))
        if partner.is_active and not was_active:
            ensure_links_for_partner(partner.id)

    db.session.commit()
    return _partner_row(partner), None


def delete_partner(partner_id: str) -> bool:
    """Remove partner, rev-share links/clicks, and stored logo. Returns False if missing."""
    partner = db.session.scalar(select(Partner).where(Partner.id == partner_id))
    if not partner:
        return False

    db.session.execute(delete(RevShareLinkClick).where(RevShareLinkClick.partner_id == partner_id))
    db.session.execute(delete(RevShareLink).where(RevShareLink.partner_id == partner_id))
    delete_stored_partner_logo(partner.logo_url)
    db.session.delete(partner)
    db.session.commit()
    return True
