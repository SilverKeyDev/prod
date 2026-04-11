"""Todo ORM → OpenAPI `TodoItem` schema."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, cast

from app.schemas.generated import TodoItem as TodoItemSchema

if TYPE_CHECKING:
    from app.models.agent.todo import Todo as TodoModel


class TodoDTO:
    @staticmethod
    def _ensure_timezone_aware(dt: datetime | None) -> str | None:
        """Convert naive datetime to timezone-aware UTC datetime ISO string."""
        if dt is None:
            return None
        # If datetime is naive (no tzinfo), assume it's UTC and add timezone info
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @staticmethod
    def from_orm(todo: TodoModel) -> TodoItemSchema:
        return TodoItemSchema(
            id=todo.id,
            agent_id=todo.agent_id,
            client_id=todo.client_id,
            title=todo.title,
            description=todo.description,
            type=cast(Any, todo.type or "manual"),
            due_date=TodoDTO._ensure_timezone_aware(todo.due_date),
            completed=bool(todo.completed),
            completed_at=TodoDTO._ensure_timezone_aware(todo.completed_at),
            created_at=TodoDTO._ensure_timezone_aware(todo.created_at) or "",
            updated_at=TodoDTO._ensure_timezone_aware(todo.updated_at) or "",
        )
