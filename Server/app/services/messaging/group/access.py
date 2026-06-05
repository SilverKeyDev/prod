"""Pure access helpers for group conversations (infrastructure tests only)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

GroupParticipantRole = Literal["owner", "member", "brokerage_admin"]


@dataclass(frozen=True)
class GroupParticipantState:
    user_id: str
    role: GroupParticipantRole
    left_at: str | None = None


def user_may_access_group_conversation(
    user_id: str, participants: list[GroupParticipantState]
) -> bool:
    uid = str(user_id)
    return any(p.user_id == uid and p.left_at is None for p in participants)


def user_may_manage_group(user_id: str, participants: list[GroupParticipantState]) -> bool:
    uid = str(user_id)
    for p in participants:
        if p.user_id != uid or p.left_at is not None:
            continue
        if p.role in ("owner", "brokerage_admin"):
            return True
    return False
