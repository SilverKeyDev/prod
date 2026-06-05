"""Group membership lifecycle — stub until group chat product ships."""

from __future__ import annotations

from app.services.messaging.group.protocol import GroupMembershipService


class GroupMembershipServiceStub:
    """Placeholder; routes must not call until group chat is enabled."""

    def add_participant(self, conversation_id: str, user_id: str, *, added_by_user_id: str) -> None:
        raise NotImplementedError("Group chat membership is not implemented")

    def remove_participant(
        self, conversation_id: str, user_id: str, *, removed_by_user_id: str
    ) -> None:
        raise NotImplementedError("Group chat membership is not implemented")

    def list_active_participants(self, conversation_id: str) -> list[str]:
        raise NotImplementedError("Group chat membership is not implemented")

    def assert_can_manage_group(self, conversation_id: str, user_id: str) -> None:
        raise NotImplementedError("Group chat membership is not implemented")


group_membership_service: GroupMembershipService = GroupMembershipServiceStub()
