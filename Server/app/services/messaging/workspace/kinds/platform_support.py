"""platform_support conversation kind policy."""

from __future__ import annotations

from typing import Any

from app.models.messaging import SUPPORT_CATEGORIES
from app.services.auth.user_role_helpers import (
    user_has_brokerage_admin,
    user_has_integration_partner,
)
from app.utils.security.admin_roles import user_has_super_admin_role

from . import _org_helpers as org
from .base import ContactSpec, ParticipantSpec


class PlatformSupportPolicy:
    kind = "platform_support"

    def _support_category_for_user(self, user: Any) -> str | None:
        if user_has_brokerage_admin(user) or org.org_ids_for_user(str(user.id), role="admin"):
            return "brokerage"
        if user_has_integration_partner(user):
            return "integrator"
        return None

    def may_access(self, user: Any, conversation: Any) -> bool:
        uid = str(user.id)
        if user_has_super_admin_role(user):
            return True
        if str(conversation.subject_user_id) == uid:
            return True
        return False

    def may_create(self, user: Any, payload: dict[str, Any]) -> bool:
        category = payload.get("support_category") or self._support_category_for_user(user)
        if category not in SUPPORT_CATEGORIES:
            return False
        if category == "brokerage":
            return bool(org.org_ids_for_user(str(user.id), role="admin"))
        if category == "integrator":
            return user_has_integration_partner(user)
        return False

    def resolve_participants_on_create(
        self, user: Any, payload: dict[str, Any]
    ) -> list[ParticipantSpec]:
        category = payload.get("support_category") or self._support_category_for_user(user)
        role = "brokerage_admin" if category == "brokerage" else "integrator"
        return [ParticipantSpec(user_id=str(user.id), participant_role=role)]

    def list_eligible_contacts(self, user: Any) -> list[ContactSpec]:
        return []

    def enrich_list_item(self, conversation: Any, item: dict[str, Any]) -> dict[str, Any]:
        item["support_category"] = conversation.support_category
        return item
