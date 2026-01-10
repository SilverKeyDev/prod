"""
Service functions for managing agent todos
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from ..auth.current_user import get_current_user
from ...models import User, Todo
from ... import db

logger = logging.getLogger(__name__)


def get_agent_todos(agent_id: str, include_completed: bool = False) -> List[Dict]:
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
        
        todos = query.order_by(Todo.due_date.asc()).all()
        
        return [todo.to_dict() for todo in todos]
        
    except Exception as e:
        logger.error(f"Error getting todos for agent {agent_id}: {e}", exc_info=True)
        raise


def create_todo(
    agent_id: str,
    title: str,
    due_date: datetime,
    priority: str = 'medium',
    todo_type: str = 'manual',
    client_id: Optional[str] = None,
    description: Optional[str] = None
) -> Dict:
    """
    Create a new todo
    
    Args:
        agent_id: The ID of the agent
        title: The todo title
        due_date: The due date
        priority: The priority (low, medium, high, urgent)
        todo_type: The type (deadline, follow_up, inspection, offer_expiration, closing, manual)
        client_id: Optional client ID
        description: Optional description
        
    Returns:
        Dictionary with todo data
    """
    try:
        if not title or not title.strip():
            raise ValueError("title is required")
        if not due_date:
            raise ValueError("due_date is required")
        
        todo = Todo(
            agent_id=agent_id,
            title=title.strip(),
            due_date=due_date,
            priority=priority,
            type=todo_type,
            client_id=client_id,
            description=description
        )
        
        db.session.add(todo)
        db.session.commit()
        
        return todo.to_dict()
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating todo: {e}", exc_info=True)
        raise


def update_todo(todo_id: str, agent_id: str, **kwargs) -> Dict:
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
        if 'title' in kwargs:
            todo.title = kwargs['title']
        if 'description' in kwargs:
            todo.description = kwargs['description']
        if 'priority' in kwargs:
            todo.priority = kwargs['priority']
        if 'type' in kwargs:
            todo.type = kwargs['type']
        if 'due_date' in kwargs:
            todo.due_date = kwargs['due_date']
        if 'completed' in kwargs:
            todo.completed = kwargs['completed']
            if kwargs['completed'] and not todo.completed_at:
                todo.completed_at = datetime.utcnow()
            elif not kwargs['completed']:
                todo.completed_at = None
        if 'client_id' in kwargs:
            todo.client_id = kwargs['client_id']
        
        todo.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return todo.to_dict()
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating todo {todo_id}: {e}", exc_info=True)
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
        logger.error(f"Error deleting todo {todo_id}: {e}", exc_info=True)
        raise
