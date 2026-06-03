"""Agent todo endpoints."""

from datetime import datetime

from flask import jsonify, request

from app.routes.agent.handlers._errors import agent_value_error_response
from app.schemas import CreateTodoRequest, CreateTodoResponse, UpdateTodoRequest, UpdateTodoResponse
from app.services.agent import (
    create_todo,
    delete_todo,
    get_agent_todos,
    get_client_todos,
    resolve_primary_agent_id_for_client,
    update_todo,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    invalid_request,
    require_authenticated_user,
    server_error,
    unauthorized,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_todos(user):
    """Todos for an agent (all their rows) or for a client (rows assigned to that client)."""
    if not user.id:
        log.error("AUTH", "User ID is None in get_todos")
        return unauthorized()
    include_completed = request.args.get("include_completed", "false").lower() == "true"
    if user_is_agent(user):
        todos = get_agent_todos(str(user.id), include_completed=include_completed)
    else:
        todos = get_client_todos(str(user.id), include_completed=include_completed)
    return jsonify({"success": True, "todos": todos})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreateTodoRequest)
@validate_response(CreateTodoResponse)
def create_todo_endpoint(user, data: CreateTodoRequest):
    """Create a new todo (agent: any client_id they pass; client: always scoped to themselves)."""
    if not user.id:
        log.error("AUTH", "User ID is None in create_todo_endpoint")
        return unauthorized()
    try:
        title = data.title
        due_date_str = data.due_date
        todo_type = data.type or "manual"
        client_id = data.client_id
        description = data.description
        if not title:
            return invalid_request("title is required")
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            except Exception:
                return validation(
                    "Invalid due_date format",
                    field_errors={"due_date": "Invalid format"},
                )
        if user_is_agent(user):
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
                return invalid_request("Connect with your agent before adding to-dos.")
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
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "create_todo", "user_id": getattr(user, "id", "unknown")}
        )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateTodoRequest)
@validate_response(UpdateTodoResponse)
def update_todo_endpoint(user, todo_id, data: UpdateTodoRequest):
    """Update a todo"""
    if not user.id:
        log.error("AUTH", "User ID is None in update_todo_endpoint")
        return unauthorized()
    try:
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
                except Exception:
                    return validation(
                        "Invalid due_date format",
                        field_errors={"due_date": "Invalid format"},
                    )
        if "completed" in source:
            update_data["completed"] = bool(source["completed"])
        if "client_id" in source:
            update_data["client_id"] = source["client_id"]
        if user_is_agent(user):
            todo = update_todo(todo_id, acting_agent_id=str(user.id), **update_data)
        else:
            todo = update_todo(todo_id, acting_client_id=str(user.id), **update_data)
        return jsonify({"success": True, "todo": todo})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "update_todo", "user_id": getattr(user, "id", "unknown")}
        )


@rate_limit(max_requests=50, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def delete_todo_endpoint(user, todo_id):
    """Delete a todo"""
    if not user.id:
        log.error("AUTH", "User ID is None in delete_todo_endpoint")
        return unauthorized()
    try:
        if user_is_agent(user):
            delete_todo(todo_id, acting_agent_id=str(user.id))
        else:
            delete_todo(todo_id, acting_client_id=str(user.id))
        return jsonify({"success": True})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "delete_todo", "user_id": getattr(user, "id", "unknown")}
        )
