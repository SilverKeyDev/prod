"""Brokerage organization preference writes."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models.brokerage import BrokerageOrg
from app.services.brokerage.membership import primary_brokerage_org_id_for_user

BROKERAGE_FIELD_MAP = {
    "brokerage_legal_business_name": "legal_business_name",
    "brokerage_primary_admin_name": "primary_admin_name",
    "brokerage_primary_admin_email": "primary_admin_email",
    "brokerage_primary_admin_phone": "primary_admin_phone",
    "brokerage_primary_admin_title": "primary_admin_title",
    "brokerage_license_number": "license_number",
}


def has_brokerage_fields(data: dict[str, Any]) -> bool:
    return any(key in data for key in BROKERAGE_FIELD_MAP)


def write_brokerage_from_payload(user_id: str, data: dict[str, Any]) -> None:
    if not has_brokerage_fields(data):
        return

    org_id = primary_brokerage_org_id_for_user(user_id)
    if not org_id:
        return

    org = db.session.scalar(select(BrokerageOrg).where(BrokerageOrg.id == org_id))
    if org is None:
        return

    for payload_key, model_attr in BROKERAGE_FIELD_MAP.items():
        if payload_key not in data:
            continue

        value = data[payload_key]
        if isinstance(value, str):
            value = value.strip() or None

        setattr(org, model_attr, value)
