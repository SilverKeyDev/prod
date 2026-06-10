"""group conversation kind policy — stub until product ships."""

from __future__ import annotations

from typing import Any

from .base import ContactSpec, ParticipantSpec


class GroupPolicy:
    kind = "group"

    def may_access(self, user: Any, conversation: Any) -> bool:
        raise NotImplementedError("Group chat is not implemented")

    def may_create(self, user: Any, payload: dict[str, Any]) -> bool:
        return False

    def resolve_participants_on_create(
        self, user: Any, payload: dict[str, Any]
    ) -> list[ParticipantSpec]:
        raise NotImplementedError("Group chat is not implemented")

    def list_eligible_contacts(self, user: Any) -> list[ContactSpec]:
        return []

    def enrich_list_item(self, conversation: Any, item: dict[str, Any]) -> dict[str, Any]:
        item["title"] = conversation.title
        item["participant_count"] = conversation.participant_count
        return item
