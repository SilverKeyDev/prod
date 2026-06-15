"""AgentConnectionRequest ORM → OpenAPI AgentConnectionRequest schema."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from app.schemas.generated import AgentConnectionRequest as AgentConnectionRequestSchema
from app.utils.db.orm_lookup import get_model
from app.utils.format.datetime import to_aware_utc_iso

if TYPE_CHECKING:
    from app.models.agent.agent_connection_request import (
        AgentConnectionRequest as AgentConnectionRequestModel,
    )
    from app.models.user.user import User as UserModel


class AgentConnectionRequestDTO:
    @staticmethod
    def _other_party(req: AgentConnectionRequestModel, *, is_agent: bool) -> UserModel | None:
        from app.models import User

        other_id = req.client_id if is_agent else req.agent_id
        return get_model(User, other_id)

    @classmethod
    def from_orm(
        cls,
        req: AgentConnectionRequestModel,
        *,
        is_agent: bool,
    ) -> AgentConnectionRequestSchema:
        other_party = cls._other_party(req, is_agent=is_agent)
        return AgentConnectionRequestSchema(
            id=req.id,
            agent_id=req.agent_id,
            client_id=req.client_id,
            requested_by_agent=req.requested_by_agent,
            status=cast(Any, req.status),
            message=req.message,
            other_party_name=other_party.name if other_party else "Unknown",
            other_party_email=other_party.email if other_party else "",
            created_at=to_aware_utc_iso(req.created_at) or "",
        )

    @classmethod
    def to_response(
        cls,
        req: AgentConnectionRequestModel,
        *,
        is_agent: bool,
    ) -> dict:
        return cls.from_orm(req, is_agent=is_agent).model_dump(mode="json")
