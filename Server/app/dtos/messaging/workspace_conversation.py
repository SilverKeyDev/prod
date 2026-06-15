"""WorkspaceConversation ORM → API dict."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.messaging.workspace_conversation import (
        WorkspaceConversation as WorkspaceConversationModel,
    )


class WorkspaceConversationDTO:
    @staticmethod
    def _format_timestamp(dt: datetime | None) -> str | None:
        if not dt:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.isoformat()

    @classmethod
    def from_orm(
        cls,
        conversation: WorkspaceConversationModel,
        *,
        user_id: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> dict:
        result: dict[str, Any] = {
            "id": conversation.id,
            "kind": conversation.kind,
            "brokerage_org_id": conversation.brokerage_org_id,
            "partner_id": conversation.partner_id,
            "subject_user_id": conversation.subject_user_id,
            "support_category": conversation.support_category,
            "agent_user_id": conversation.agent_user_id,
            "title": conversation.title,
            "participant_count": conversation.participant_count,
            "is_archived": conversation.is_archived,
            "created_at": cls._format_timestamp(conversation.created_at),
            "updated_at": cls._format_timestamp(conversation.updated_at),
            "last_message_at": cls._format_timestamp(conversation.last_message_at),
        }
        if user_id and conversation.last_read_at:
            try:
                last_read_dict = (
                    json.loads(conversation.last_read_at)
                    if isinstance(conversation.last_read_at, str)
                    else conversation.last_read_at
                )
                read_str = (
                    last_read_dict.get(str(user_id)) if isinstance(last_read_dict, dict) else None
                )
                if read_str:
                    if read_str.endswith("Z"):
                        read_str = read_str.replace("Z", "+00:00")
                    result["last_read_at"] = datetime.fromisoformat(read_str).isoformat()
            except Exception:
                result["last_read_at"] = None
        if extra:
            result.update(extra)
        return result
