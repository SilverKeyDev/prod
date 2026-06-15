"""AgentConnections ORM → API conversation dict."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.agent.agent_connections import AgentConnections as AgentConnectionsModel


class AgentConversationDTO:
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
        conversation: AgentConnectionsModel,
        *,
        user_id: str | None = None,
    ) -> dict:
        result = {
            "id": conversation.id,
            "agent_id": conversation.agent_id,
            "client_id": conversation.client_id,
            "created_at": cls._format_timestamp(conversation.created_at),
            "updated_at": cls._format_timestamp(conversation.updated_at),
            "last_message_at": cls._format_timestamp(conversation.last_message_at),
        }
        if user_id:
            last_read = conversation.get_last_read(user_id)
            result["last_read_at"] = cls._format_timestamp(last_read)
        return result
