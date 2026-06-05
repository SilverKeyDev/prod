"""Kind policy types for workspace conversations."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(frozen=True)
class ParticipantSpec:
    user_id: str
    participant_role: str


@dataclass(frozen=True)
class ContactSpec:
    contact_id: str
    contact_type: str
    display_name: str
    metadata: dict[str, Any] = field(default_factory=dict)


class ConversationKindPolicy(Protocol):
    kind: str

    def may_access(self, user: Any, conversation: Any) -> bool:
        ...

    def may_create(self, user: Any, payload: dict[str, Any]) -> bool:
        ...

    def resolve_participants_on_create(
        self, user: Any, payload: dict[str, Any]
    ) -> list[ParticipantSpec]:
        ...

    def list_eligible_contacts(self, user: Any) -> list[ContactSpec]:
        ...

    def enrich_list_item(self, conversation: Any, item: dict[str, Any]) -> dict[str, Any]:
        ...
