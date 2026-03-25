"""
Service functions for managing agent todos
"""

import os
import sys
from datetime import datetime

from ... import db
from ...models import Todo

# Initialize centralized logger
server_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    LOG_CATEGORIES,
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
        query = Todo.query.filter_by(agent_id=agent_id)

        if not include_completed:
            query = query.filter_by(completed=False)

        # Order by due_date, handling potential None values by putting them last
        # Use nullslast() to handle any edge cases where due_date might be None
        try:
            from sqlalchemy import nullslast

            todos = query.order_by(nullslast(Todo.due_date.asc())).all()
        except (ImportError, AttributeError):
            # Fallback for older SQLAlchemy versions or if nullslast is not available
            # Since due_date is nullable=False in the model, this should rarely be needed
            todos = query.order_by(Todo.due_date.asc()).all()

        # Convert todos to dictionaries, handling any potential serialization errors
        result = []
        for todo in todos:
            try:
                result.append(todo.to_dict())
            except Exception as e:
                log.error(LOG_CATEGORIES["ERRORS"], f"Error serializing todo {todo.id} to dict", e)
                # Continue with other todos even if one fails
                continue

        return result

    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], f"Error getting todos for agent {agent_id}", e)
        raise


def create_todo(
    agent_id: str,
    title: str,
    due_date: datetime | None = None,
    priority: str | None = None,
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
        priority: Optional priority (low, medium, high, urgent)
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
            priority=priority,
            type=todo_type,
            client_id=client_id,
            description=description,
        )

        db.session.add(todo)
        db.session.commit()

        return todo.to_dict()

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], "Error creating todo", e)
        raise


def update_todo(todo_id: str, agent_id: str, **kwargs) -> dict:
    """
    Update a todo

    Args:
        todo_id: The ID of the todo
        agent_id: The ID of the agent (for authorization)
        **kwargs: Fields to update (title, description, priority, type, due_date, completed)

    Returns:
        Dictionary with updated todo data
    """
    try:
        todo = Todo.query.filter_by(id=todo_id, agent_id=agent_id).first()
        if not todo:
            raise ValueError(f"Todo {todo_id} not found")

        # Update fields
        if "title" in kwargs:
            todo.title = kwargs["title"]
        if "description" in kwargs:
            todo.description = kwargs["description"]
        if "priority" in kwargs:
            todo.priority = kwargs["priority"]
        if "type" in kwargs:
            todo.type = kwargs["type"]
        if "due_date" in kwargs:
            todo.due_date = kwargs["due_date"]
        if "completed" in kwargs:
            todo.completed = kwargs["completed"]
            if kwargs["completed"] and not todo.completed_at:
                todo.completed_at = datetime.utcnow()
            elif not kwargs["completed"]:
                todo.completed_at = None
        if "client_id" in kwargs:
            todo.client_id = kwargs["client_id"]

        todo.updated_at = datetime.utcnow()

        db.session.commit()

        return todo.to_dict()

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], f"Error updating todo {todo_id}", e)
        raise


def delete_todo(todo_id: str, agent_id: str) -> bool:
    """
    Delete a todo

    Args:
        todo_id: The ID of the todo
        agent_id: The ID of the agent (for authorization)

    Returns:
        True if deleted successfully
    """
    try:
        todo = Todo.query.filter_by(id=todo_id, agent_id=agent_id).first()
        if not todo:
            raise ValueError(f"Todo {todo_id} not found")

        db.session.delete(todo)
        db.session.commit()

        return True

    except Exception as e:
        db.session.rollback()
        log.error(LOG_CATEGORIES["ERRORS"], f"Error deleting todo {todo_id}", e)
        raise
