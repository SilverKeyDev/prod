"""Thin access dispatcher for workspace conversation policies."""

from __future__ import annotations

from typing import Any

from app.services.messaging.workspace.kinds import get_policy
from app.utils.security.admin_roles import user_has_super_admin_role


def user_may_access_workspace_conversation(user: Any, conversation: Any) -> bool:
    if conversation is None or not user or not getattr(user, "id", None):
        return False
    kind = getattr(conversation, "kind", None)
    if kind == "platform_support" and user_has_super_admin_role(user):
        return True
    policy = get_policy(str(kind))
    return policy.may_access(user, conversation)
