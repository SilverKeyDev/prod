"""Shared fixtures for workspace messaging tests."""

from __future__ import annotations

from decimal import Decimal

from app import db
from app.models import (
    BrokerageOrg,
    BrokeragePartnerAdoption,
    Partner,
    PartnerOperator,
    User,
    UserOrgMembership,
)
from app.services.auth.user_role_helpers import ensure_user_role


def create_brokerage_org(
    *, name: str = "Test Brokerage", slug: str = "test-brokerage"
) -> BrokerageOrg:
    org = BrokerageOrg(name=name, slug=slug)
    db.session.add(org)
    db.session.flush()
    return org


def create_user(
    *,
    user_id: str,
    email: str,
    name: str = "Test User",
    roles: tuple[str, ...] = (),
) -> User:
    user = User(
        id=user_id,
        cognito_id=f"cognito-{user_id}",
        email=email,
        name=name,
    )
    db.session.add(user)
    db.session.flush()
    for role in roles:
        ensure_user_role(user_id, role)
    return user


def add_org_membership(*, user_id: str, org_id: str, role: str) -> UserOrgMembership:
    row = UserOrgMembership(user_id=user_id, brokerage_org_id=org_id, role=role)
    db.session.add(row)
    db.session.flush()
    return row


def create_partner(*, partner_id: str = "partner-1", slug: str = "test-partner") -> Partner:
    partner = Partner(
        id=partner_id,
        name="Test Partner",
        slug=slug,
        destination_url_template="https://example.com/{id}",
        step_id="close",
        step_ids=["close"],
        target_roles=["brokerage"],
        payout_type="on_click",
        payout_per_conversion=Decimal("0"),
    )
    db.session.add(partner)
    db.session.flush()
    return partner


def link_partner_operator(*, user_id: str, partner_id: str) -> PartnerOperator:
    row = PartnerOperator(user_id=user_id, partner_id=partner_id)
    db.session.add(row)
    db.session.flush()
    return row


def adopt_partner(*, org_id: str, partner_id: str) -> BrokeragePartnerAdoption:
    row = BrokeragePartnerAdoption(brokerage_org_id=org_id, partner_id=partner_id)
    db.session.add(row)
    db.session.flush()
    return row
