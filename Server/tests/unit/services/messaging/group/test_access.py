"""Group conversation access helpers (infrastructure only — no routes)."""

from app.services.messaging.group.access import (
    GroupParticipantState,
    user_may_access_group_conversation,
    user_may_manage_group,
)


def _participants(*specs: tuple[str, str, str | None]) -> list[GroupParticipantState]:
    return [
        GroupParticipantState(user_id=uid, role=role, left_at=left_at)  # type: ignore[arg-type]
        for uid, role, left_at in specs
    ]


class TestGroupAccess:
    def test_active_member_may_access(self):
        parts = _participants(("u1", "member", None), ("u2", "owner", None))
        assert user_may_access_group_conversation("u1", parts) is True

    def test_left_member_may_not_access(self):
        parts = _participants(("u1", "member", "2026-01-01T00:00:00+00:00"))
        assert user_may_access_group_conversation("u1", parts) is False

    def test_non_participant_may_not_access(self):
        parts = _participants(("u2", "owner", None))
        assert user_may_access_group_conversation("u1", parts) is False

    def test_owner_may_manage(self):
        parts = _participants(("u1", "owner", None), ("u2", "member", None))
        assert user_may_manage_group("u1", parts) is True

    def test_brokerage_admin_may_manage(self):
        parts = _participants(("u1", "brokerage_admin", None))
        assert user_may_manage_group("u1", parts) is True

    def test_member_may_not_manage(self):
        parts = _participants(("u1", "member", None))
        assert user_may_manage_group("u1", parts) is False

    def test_left_owner_may_not_manage(self):
        parts = _participants(("u1", "owner", "2026-01-01T00:00:00+00:00"))
        assert user_may_manage_group("u1", parts) is False
