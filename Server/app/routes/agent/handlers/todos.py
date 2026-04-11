"""Agent todo endpoints."""

import logging
from datetime import datetime

from flask import jsonify, request
from jose.exceptions import ExpiredSignatureError, JWTError

from app.schemas import CreateTodoRequest, CreateTodoResponse, UpdateTodoRequest, UpdateTodoResponse
from app.services.agent import (
    create_todo,
    delete_todo,
    get_agent_todos,
    get_client_todos,
    resolve_primary_agent_id_for_client,
    update_todo,
)
from app.services.auth import SecurityException
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import rate_limit
from app.utils.validation import validate_request, validate_response

logger = logging.getLogger(__name__)


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_todos(user):
    """Todos for an agent (all their rows) or for a client (rows assigned to that client)."""
    if not user.id:
        logger.error("User ID is None in get_todos")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    include_completed = request.args.get("include_completed", "false").lower() == "true"
    if user.is_agent:
        todos = get_agent_todos(str(user.id), include_completed=include_completed)
    else:
        todos = get_client_todos(str(user.id), include_completed=include_completed)
    return jsonify({"success": True, "todos": todos})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreateTodoRequest)
@validate_response(CreateTodoResponse)
def create_todo_endpoint(user, data: CreateTodoRequest | None = None):
    """Create a new todo (agent: any client_id they pass; client: always scoped to themselves)."""
    if not user.id:
        logger.error("User ID is None in create_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        if data is None:
            request_data = request.get_json(silent=True) or {}
            title = request_data.get("title")
            due_date_str = request_data.get("due_date")
            todo_type = request_data.get("type", "manual")
            client_id = request_data.get("client_id")
            description = request_data.get("description")
        else:
            request_data = data.model_dump(mode="json")
            title = request_data["title"]
            due_date_str = request_data.get("due_date")
            todo_type = request_data.get("type") or "manual"
            client_id = request_data.get("client_id")
            description = request_data.get("description")
        if not title:
            return jsonify({"success": False, "error": "title is required"}), 400
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            except Exception as e:
                return jsonify(
                    {"success": False, "error": f"Invalid due_date format: {str(e)}"}
                ), 400
        if user.is_agent:
            todo = create_todo(
                agent_id=str(user.id),
                title=title,
                due_date=due_date,
                todo_type=todo_type,
                client_id=client_id,
                description=description,
            )
        else:
            agent_for_row = resolve_primary_agent_id_for_client(user)
            if not agent_for_row:
                return jsonify(
                    {
                        "success": False,
                        "error": "Connect with your agent before adding to-dos.",
                    }
                ), 400
            todo = create_todo(
                agent_id=agent_for_row,
                title=title,
                due_date=due_date,
                todo_type=todo_type,
                client_id=str(user.id),
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
@require_authenticated_user
@validate_request(UpdateTodoRequest)
@validate_response(UpdateTodoResponse)
def update_todo_endpoint(user, todo_id, data: UpdateTodoRequest | None = None):
    """Update a todo"""
    if not user.id:
        logger.error("User ID is None in update_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        if data is None:
            source = request.get_json(silent=True) or {}
        else:
            source = data.model_dump(mode="json", exclude_unset=True)
        update_data = {}
        if "title" in source:
            update_data["title"] = source["title"]
        if "description" in source:
            update_data["description"] = source["description"]
        if "type" in source:
            update_data["type"] = source["type"]
        if "due_date" in source:
            if source["due_date"] is None:
                update_data["due_date"] = None
            else:
                try:
                    due_date = datetime.fromisoformat(
                        str(source["due_date"]).replace("Z", "+00:00")
                    )
                    update_data["due_date"] = due_date
                except Exception as e:
                    return jsonify(
                        {"success": False, "error": f"Invalid due_date format: {str(e)}"}
                    ), 400
        if "completed" in source:
            update_data["completed"] = bool(source["completed"])
        if "client_id" in source:
            update_data["client_id"] = source["client_id"]
        if user.is_agent:
            todo = update_todo(todo_id, acting_agent_id=str(user.id), **update_data)
        else:
            todo = update_todo(todo_id, acting_client_id=str(user.id), **update_data)
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
@require_authenticated_user
def delete_todo_endpoint(user, todo_id):
    """Delete a todo"""
    if not user.id:
        logger.error("User ID is None in delete_todo_endpoint")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        if user.is_agent:
            delete_todo(todo_id, acting_agent_id=str(user.id))
        else:
            delete_todo(todo_id, acting_client_id=str(user.id))
        return jsonify({"success": True})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "delete_todo", "user_id": getattr(user, "id", "unknown")}
        )
