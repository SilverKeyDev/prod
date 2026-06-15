"""Group chat service protocol (future product — not wired to routes)."""

from __future__ import annotations

from typing import Protocol


class GroupMembershipService(Protocol):
    def add_participant(self, conversation_id: str, user_id: str, *, added_by_user_id: str) -> None:
        ...

    def remove_participant(
        self, conversation_id: str, user_id: str, *, removed_by_user_id: str
    ) -> None:
        ...

    def list_active_participants(self, conversation_id: str) -> list[str]:
        ...

    def assert_can_manage_group(self, conversation_id: str, user_id: str) -> None:
        ...
