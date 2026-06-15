"""brokerage_agent conversation kind policy."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import User, UserOrgMembership

from . import _org_helpers as org
from .base import ContactSpec, ParticipantSpec


class BrokerageAgentPolicy:
    kind = "brokerage_agent"

    def may_access(self, user: Any, conversation: Any) -> bool:
        uid = str(user.id)
        org_id = str(conversation.brokerage_org_id)
        agent_id = str(conversation.agent_user_id)
        if uid == agent_id:
            return True
        return org.user_is_org_member(uid, org_id)

    def may_create(self, user: Any, payload: dict[str, Any]) -> bool:
        org_id = payload.get("brokerage_org_id")
        agent_user_id = payload.get("agent_user_id")
        if not org_id or not agent_user_id:
            return False
        uid = str(user.id)
        if uid == str(agent_user_id) and org.user_is_org_agent(uid, str(org_id)):
            return True
        if org.user_is_org_admin(uid, str(org_id)):
            agent_row = db.session.scalar(
                select(UserOrgMembership).where(
                    UserOrgMembership.user_id == str(agent_user_id),
                    UserOrgMembership.brokerage_org_id == str(org_id),
                    UserOrgMembership.role == "agent",
                )
            )
            return agent_row is not None
        return False

    def resolve_participants_on_create(
        self, user: Any, payload: dict[str, Any]
    ) -> list[ParticipantSpec]:
        org_id = str(payload["brokerage_org_id"])
        agent_user_id = str(payload["agent_user_id"])
        uid = str(user.id)
        specs: list[ParticipantSpec] = [
            ParticipantSpec(user_id=agent_user_id, participant_role="agent"),
        ]
        if org.user_is_org_admin(uid, org_id):
            specs.append(ParticipantSpec(user_id=uid, participant_role="brokerage_admin"))
        elif uid == agent_user_id:
            admins = db.session.scalars(
                select(UserOrgMembership).where(
                    UserOrgMembership.brokerage_org_id == org_id,
                    UserOrgMembership.role == "admin",
                )
            ).all()
            for row in admins:
                specs.append(
                    ParticipantSpec(user_id=str(row.user_id), participant_role="brokerage_admin")
                )
        return specs

    def list_eligible_contacts(self, user: Any) -> list[ContactSpec]:
        uid = str(user.id)
        org_ids = org.org_ids_for_user(uid, role="admin") or org.org_ids_for_user(uid, role="agent")
        if not org_ids:
            return []
        contacts: list[ContactSpec] = []
        for org_id in org_ids:
            if org.user_is_org_admin(uid, org_id):
                agents = db.session.scalars(
                    select(UserOrgMembership).where(
                        UserOrgMembership.brokerage_org_id == org_id,
                        UserOrgMembership.role == "agent",
                    )
                ).all()
                for row in agents:
                    agent = db.session.scalar(select(User).where(User.id == row.user_id))
                    if agent:
                        contacts.append(
                            ContactSpec(
                                contact_id=str(agent.id),
                                contact_type="agent",
                                display_name=agent.name or agent.email,
                                metadata={"brokerage_org_id": org_id},
                            )
                        )
            elif org.user_is_org_agent(uid, org_id):
                contacts.append(
                    ContactSpec(
                        contact_id=uid,
                        contact_type="self_agent",
                        display_name="You (agent)",
                        metadata={"brokerage_org_id": org_id},
                    )
                )
        return contacts

    def enrich_list_item(self, conversation: Any, item: dict[str, Any]) -> dict[str, Any]:
        item["brokerage_org_id"] = conversation.brokerage_org_id
        item["agent_user_id"] = conversation.agent_user_id
        return item
