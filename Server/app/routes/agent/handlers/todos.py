"""Agent todo endpoints."""

import logging
from datetime import datetime

from flask import jsonify, request
from jose.exceptions import ExpiredSignatureError, JWTError

from app.services.agent import create_todo, delete_todo, get_agent_todos, update_todo
from app.services.auth import SecurityException
from app.utils.common_patterns import handle_exceptions_with_logging, require_agent_access
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import rate_limit

logger = logging.getLogger(__name__)


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def get_todos(user):
    """Get list of todos for authenticated agent"""
    if not user.id:
        logger.error("User ID is None in get_todos")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    include_completed = request.args.get("include_completed", "false").lower() == "true"
    todos = get_agent_todos(str(user.id), include_completed=include_completed)
    return jsonify({"success": True, "todos": todos})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def create_todo_endpoint(user):
    """Create a new todo"""
    if not user.id:
        logger.error("User ID is None in create_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        data = request.get_json(force=True)
        title = data.get("title")
        due_date_str = data.get("due_date")
        priority = data.get("priority", "medium")
        todo_type = data.get("type", "manual")
        client_id = data.get("client_id")
        description = data.get("description")
        if not title:
            return jsonify({"success": False, "error": "title is required"}), 400
        if not due_date_str:
            return jsonify({"success": False, "error": "due_date is required"}), 400
        try:
            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        except Exception as e:
            return jsonify({"success": False, "error": f"Invalid due_date format: {str(e)}"}), 400
        todo = create_todo(
            agent_id=str(user.id),
            title=title,
            due_date=due_date,
            priority=priority,
            todo_type=todo_type,
            client_id=client_id,
            description=description,
        )
        return jsonify({"success": True, "todo": todo})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "create_todo", "user_id": getattr(user, "id", "unknown")}
        )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def update_todo_endpoint(user, todo_id):
    """Update a todo"""
    if not user.id:
        logger.error("User ID is None in update_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        data = request.get_json(force=True)
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        if "type" in data:
            update_data["type"] = data["type"]
        if "due_date" in data:
            try:
                due_date = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
                update_data["due_date"] = due_date
            except Exception as e:
                return jsonify(
                    {"success": False, "error": f"Invalid due_date format: {str(e)}"}
                ), 400
        if "completed" in data:
            update_data["completed"] = bool(data["completed"])
        if "client_id" in data:
            update_data["client_id"] = data["client_id"]
        todo = update_todo(todo_id, str(user.id), **update_data)
        return jsonify({"success": True, "todo": todo})
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "update_todo", "user_id": "unknown"}
        )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def delete_todo_endpoint(user, todo_id):
    """Delete a todo"""
    if not user.id:
        logger.error("User ID is None in delete_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        delete_todo(todo_id, str(user.id))
        return jsonify({"success": True})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "delete_todo", "user_id": getattr(user, "id", "unknown")}
        )
