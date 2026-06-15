"""integrator_brokerage conversation kind policy."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import (
    BrokerageOrg,
    BrokeragePartnerAdoption,
    Partner,
    PartnerOperator,
    UserOrgMembership,
)

from . import _org_helpers as org
from .base import ContactSpec, ParticipantSpec


class IntegratorBrokeragePolicy:
    kind = "integrator_brokerage"

    def _partner_ids_for_user(self, user_id: str) -> list[str]:
        rows = db.session.scalars(
            select(PartnerOperator).where(PartnerOperator.user_id == str(user_id))
        ).all()
        return [str(r.partner_id) for r in rows]

    def may_access(self, user: Any, conversation: Any) -> bool:
        uid = str(user.id)
        partner_id = str(conversation.partner_id)
        org_id = str(conversation.brokerage_org_id)
        if str(partner_id) in self._partner_ids_for_user(uid):
            return True
        return org.user_is_org_admin(uid, org_id)

    def may_create(self, user: Any, payload: dict[str, Any]) -> bool:
        partner_id = payload.get("partner_id")
        org_id = payload.get("brokerage_org_id")
        if not partner_id or not org_id:
            return False
        uid = str(user.id)
        adoption = db.session.scalar(
            select(BrokeragePartnerAdoption).where(
                BrokeragePartnerAdoption.partner_id == str(partner_id),
                BrokeragePartnerAdoption.brokerage_org_id == str(org_id),
            )
        )
        if not adoption:
            return False
        if str(partner_id) in self._partner_ids_for_user(uid):
            return True
        return org.user_is_org_admin(uid, str(org_id))

    def _org_admin_specs(self, org_id: str) -> list[ParticipantSpec]:
        admins = db.session.scalars(
            select(UserOrgMembership).where(
                UserOrgMembership.brokerage_org_id == str(org_id),
                UserOrgMembership.role == "admin",
            )
        ).all()
        return [
            ParticipantSpec(user_id=str(row.user_id), participant_role="brokerage_admin")
            for row in admins
        ]

    def _integrator_specs(self, partner_id: str) -> list[ParticipantSpec]:
        operators = db.session.scalars(
            select(PartnerOperator).where(PartnerOperator.partner_id == str(partner_id))
        ).all()
        return [
            ParticipantSpec(user_id=str(op.user_id), participant_role="integrator")
            for op in operators
        ]

    def resolve_participants_on_create(
        self, user: Any, payload: dict[str, Any]
    ) -> list[ParticipantSpec]:
        partner_id = str(payload["partner_id"])
        org_id = str(payload["brokerage_org_id"])
        uid = str(user.id)
        specs: list[ParticipantSpec] = []
        seen: set[str] = set()

        def add(spec: ParticipantSpec) -> None:
            if spec.user_id in seen:
                return
            seen.add(spec.user_id)
            specs.append(spec)

        if str(partner_id) in self._partner_ids_for_user(uid):
            add(ParticipantSpec(user_id=uid, participant_role="integrator"))
            for spec in self._org_admin_specs(org_id):
                add(spec)
        else:
            add(ParticipantSpec(user_id=uid, participant_role="brokerage_admin"))
            for spec in self._integrator_specs(partner_id):
                add(spec)
        return specs

    def list_eligible_contacts(self, user: Any) -> list[ContactSpec]:
        uid = str(user.id)
        partner_ids = self._partner_ids_for_user(uid)
        contacts: list[ContactSpec] = []
        if partner_ids:
            for partner_id in partner_ids:
                adoptions = db.session.scalars(
                    select(BrokeragePartnerAdoption).where(
                        BrokeragePartnerAdoption.partner_id == partner_id
                    )
                ).all()
                partner = db.session.scalar(select(Partner).where(Partner.id == partner_id))
                for adoption in adoptions:
                    brokerage = db.session.scalar(
                        select(BrokerageOrg).where(BrokerageOrg.id == adoption.brokerage_org_id)
                    )
                    if brokerage:
                        contacts.append(
                            ContactSpec(
                                contact_id=str(brokerage.id),
                                contact_type="brokerage",
                                display_name=brokerage.name or brokerage.slug,
                                metadata={
                                    "partner_id": partner_id,
                                    "partner_name": partner.name if partner else None,
                                },
                            )
                        )
        else:
            for org_id in org.org_ids_for_user(uid, role="admin"):
                adoptions = db.session.scalars(
                    select(BrokeragePartnerAdoption).where(
                        BrokeragePartnerAdoption.brokerage_org_id == org_id
                    )
                ).all()
                for adoption in adoptions:
                    partner = db.session.scalar(
                        select(Partner).where(Partner.id == adoption.partner_id)
                    )
                    if partner:
                        contacts.append(
                            ContactSpec(
                                contact_id=str(partner.id),
                                contact_type="integrator_partner",
                                display_name=partner.name,
                                metadata={"brokerage_org_id": org_id},
                            )
                        )
        return contacts

    def enrich_list_item(self, conversation: Any, item: dict[str, Any]) -> dict[str, Any]:
        item["brokerage_org_id"] = conversation.brokerage_org_id
        item["partner_id"] = conversation.partner_id
        return item
