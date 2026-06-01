"""Admin CRUD for rev-share partners."""

from __future__ import annotations

import re
from decimal import Decimal

from app import db
from app.models import Partner
from app.models.partners.partner import CHECKLIST_WORKSPACES
from app.services.rev_share.analytics import partner_list_metrics
from app.services.rev_share.link_provisioning import ensure_links_for_partner
from app.services.rev_share.partner_logo import enrich_partner_dict_logo
from app.services.rev_share.partner_validation import (
    normalize_payout_type,
    normalize_step_ids,
    normalize_target_roles,
    sync_step_id_from_step_ids,
    validate_partner_fields,
)
from app.services.rev_share.url_template import validate_template_placeholders

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _parse_decimal(value, default: str = "0") -> Decimal:
    if value is None:
        return Decimal(default)
    return Decimal(str(value))


def _partner_row(partner: Partner) -> dict:
    metrics = partner_list_metrics(partner.id, partner.resolved_step_ids())
    row = enrich_partner_dict_logo(partner.to_dict())
    row.update(metrics)
    return row


def list_partners() -> list[dict]:
    partners = Partner.query.order_by(Partner.name).all()
    return [_partner_row(p) for p in partners]


def get_partner(partner_id: str) -> dict | None:
    p = Partner.query.filter_by(id=partner_id).first()
    if not p:
        return None
    return _partner_row(p)


def create_partner(payload: dict) -> tuple[dict | None, str | None]:
    slug = (payload.get("slug") or "").strip().lower()
    if not _SLUG_RE.match(slug):
        return None, "invalid_slug"
    if Partner.query.filter_by(slug=slug).first():
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
        logo_url=(payload.get("logo_url") or "").strip() or None,
        description=(payload.get("description") or "").strip() or None,
        step_id=primary_step,
        step_ids=step_ids,
        target_roles=target_roles,
        payout_type=payout_type,
        payout_per_conversion=_parse_decimal(payload.get("payout_per_conversion")),
        is_active=True,
    )
    if not partner.name or not partner.destination_url_template:
        return None, "missing_required_fields"

    db.session.add(partner)
    db.session.commit()
    ensure_links_for_partner(partner.id)
    return _partner_row(partner), None


def update_partner(partner_id: str, payload: dict) -> tuple[dict | None, str | None]:
    partner = Partner.query.filter_by(id=partner_id).first()
    if not partner:
        return None, "not_found"

    if "slug" in payload:
        slug = (payload.get("slug") or "").strip().lower()
        if not _SLUG_RE.match(slug):
            return None, "invalid_slug"
        existing = Partner.query.filter(Partner.slug == slug, Partner.id != partner_id).first()
        if existing:
            return None, "slug_exists"
        partner.slug = slug

    if "destination_url_template" in payload:
        template = (payload.get("destination_url_template") or "").strip()
        unknown = validate_template_placeholders(template)
        if unknown:
            return None, f"unknown_placeholders:{','.join(unknown)}"
        partner.destination_url_template = template

    for field in ("name", "logo_url", "description"):
        if field in payload:
            val = payload.get(field)
            if field == "name":
                partner.name = (val or "").strip()
            else:
                setattr(partner, field, (val or "").strip() or None)

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
