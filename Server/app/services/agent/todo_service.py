"""
Service functions for managing agent todos
"""

import os
import sys
from datetime import datetime, timezone

from sqlalchemy import nullslast, select

from app import db
from app.dtos.todo import TodoDTO
from app.models import Todo, User

from ...services.agent.client_service import get_connected_agent_ids_for_client
from ...services.auth.user_role_helpers import get_user_if_agent

# Initialize centralized logger
server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    log,
)


def get_agent_todos(agent_id: str, include_completed: bool = False) -> list[dict]:
    """
    Get all todos for a specific agent

    Args:
        agent_id: The ID of the agent
        include_completed: Whether to include completed todos

    Returns:
        List of todo dictionaries
    """
    try:
        stmt = select(Todo).where(Todo.agent_id == agent_id)
        if not include_completed:
            stmt = stmt.where(Todo.completed.is_(False))
        # Order by due_date, handling potential None values by putting them last
        try:
            todos = db.session.scalars(stmt.order_by(nullslast(Todo.due_date.asc()))).all()
        except (ImportError, AttributeError):
            todos = db.session.scalars(stmt.order_by(Todo.due_date.asc())).all()

        # Convert todos to dictionaries, handling any potential serialization errors
        result = []
        for todo in todos:
            try:
                result.append(TodoDTO.from_orm(todo).model_dump(mode="json"))
            except Exception as e:
                log.error("ERRORS", f"Error serializing todo {todo.id} to dict", e)
                # Continue with other todos even if one fails
                continue

        return result

    except Exception as e:
        log.error("ERRORS", f"Error getting todos for agent {agent_id}", e)
        raise


def _parse_buyer_linked_agent_ids(client_user: User) -> list[str]:
    """Agent ids linked to this client via ``agent_conversations`` (preference order)."""
    try:
        linked = get_connected_agent_ids_for_client(str(client_user.id))
        return list(linked)
    except Exception:
        return []


def resolve_primary_agent_id_for_client(client_user: User) -> str | None:
    """
    First linked agent id that is still an agent account (preserves user preference order).
    Client-created todos are stored under this agent so the agent sees them in their list.
    """
    agent_ids = _parse_buyer_linked_agent_ids(client_user)
    if not agent_ids:
        return None
    for aid in agent_ids:
        if get_user_if_agent(aid) is not None:
            return aid
    return None


def get_client_todos(client_user_id: str, include_completed: bool = False) -> list[dict]:
    """To-dos assigned to this client (same rows the agent sees when filtered by client_id)."""
    try:
        stmt = select(Todo).where(Todo.client_id == client_user_id)
        if not include_completed:
            stmt = stmt.where(Todo.completed.is_(False))
        try:
            todos = db.session.scalars(stmt.order_by(nullslast(Todo.due_date.asc()))).all()
        except (ImportError, AttributeError):
            todos = db.session.scalars(stmt.order_by(Todo.due_date.asc())).all()

        result = []
        for todo in todos:
            try:
                result.append(TodoDTO.from_orm(todo).model_dump(mode="json"))
            except Exception as e:
                log.error("ERRORS", f"Error serializing todo {todo.id} to dict", e)
                continue

        return result

    except Exception as e:
        log.error("ERRORS", f"Error getting todos for client {client_user_id}", e)
        raise


def create_todo(
    agent_id: str,
    title: str,
    due_date: datetime | None = None,
    todo_type: str = "manual",
    client_id: str | None = None,
    description: str | None = None,
) -> dict:
    """
    Create a new todo

    Args:
        agent_id: The ID of the agent
        title: The todo title
        due_date: Optional due date (omit for no deadline)
        todo_type: The type (deadline, follow_up, inspection, offer_expiration, closing, manual)
        client_id: Optional client ID
        description: Optional description

    Returns:
        Dictionary with todo data
    """
    try:
        if not title or not title.strip():
            raise ValueError("title is required")

        todo = Todo(
            agent_id=agent_id,
            title=title.strip(),
            due_date=due_date,
            type=todo_type,
            client_id=client_id,
            description=description,
        )

        db.session.add(todo)
        db.session.commit()

        return TodoDTO.from_orm(todo).model_dump(mode="json")

    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", "Error creating todo", e)
        raise


def update_todo(
    todo_id: str,
    *,
    acting_agent_id: str | None = None,
    acting_client_id: str | None = None,
    **kwargs: object,
) -> dict:
    """
    Update a todo. Exactly one of acting_agent_id or acting_client_id must be set.

    Args:
        todo_id: The ID of the todo
        acting_agent_id: Agent owning the todo row
        acting_client_id: Client assigned to the todo (may only update their own rows)
        **kwargs: Fields to update (title, description, type, due_date, completed, client_id)

    Returns:
        Dictionary with updated todo data
    """
    has_agent = acting_agent_id is not None
    has_client = acting_client_id is not None
    if has_agent == has_client:
        raise ValueError("Specify exactly one of acting_agent_id or acting_client_id")
    effective: dict[str, object] = dict(kwargs)
    if acting_client_id is not None:
        effective.pop("client_id", None)
    try:
        if acting_agent_id is not None:
            todo = db.session.scalar(
                select(Todo).where(Todo.id == todo_id, Todo.agent_id == acting_agent_id)
            )
        else:
            todo = db.session.scalar(
                select(Todo).where(Todo.id == todo_id, Todo.client_id == acting_client_id)
            )
        if not todo:
            raise ValueError(f"Todo {todo_id} not found")

        if "title" in effective:
            todo.title = effective["title"]  # type: ignore[assignment]
        if "description" in effective:
            todo.description = effective["description"]  # type: ignore[assignment]
        if "type" in effective:
            todo.type = effective["type"]  # type: ignore[assignment]
        if "due_date" in effective:
            todo.due_date = effective["due_date"]  # type: ignore[assignment]
        if "completed" in effective:
            todo.completed = effective["completed"]  # type: ignore[assignment]
            if effective["completed"] and not todo.completed_at:
                todo.completed_at = datetime.now(timezone.utc)
            elif not effective["completed"]:
                todo.completed_at = None
        if "client_id" in effective:
            todo.client_id = effective["client_id"]  # type: ignore[assignment]

        todo.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        return TodoDTO.from_orm(todo).model_dump(mode="json")

    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", f"Error updating todo {todo_id}", e)
        raise


def delete_todo(
    todo_id: str,
    *,
    acting_agent_id: str | None = None,
    acting_client_id: str | None = None,
) -> bool:
    """
    Delete a todo. Exactly one of acting_agent_id or acting_client_id must be set.

    Args:
        todo_id: The ID of the todo
        acting_agent_id: Agent owning the row
        acting_client_id: Client assigned to the todo

    Returns:
        True if deleted successfully
    """
    has_agent = acting_agent_id is not None
    has_client = acting_client_id is not None
    if has_agent == has_client:
        raise ValueError("Specify exactly one of acting_agent_id or acting_client_id")
    try:
        if acting_agent_id is not None:
            todo = db.session.scalar(
                select(Todo).where(Todo.id == todo_id, Todo.agent_id == acting_agent_id)
            )
        else:
            todo = db.session.scalar(
                select(Todo).where(Todo.id == todo_id, Todo.client_id == acting_client_id)
            )
        if not todo:
            raise ValueError(f"Todo {todo_id} not found")

        db.session.delete(todo)
        db.session.commit()

        return True

    except Exception as e:
        db.session.rollback()
        log.error("ERRORS", f"Error deleting todo {todo_id}", e)
        raise
