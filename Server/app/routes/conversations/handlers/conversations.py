"""Workspace conversation HTTP handlers."""

from __future__ import annotations

from flask import Response, jsonify, request, stream_with_context

from app.routes.agent.handlers.chats_stream import _messaging_sse_generator
from app.schemas import (
    CreateWorkspaceConversationRequest,
    CreateWorkspaceConversationResponse,
    EmptyRequest,
    SendWorkspaceMessageRequest,
    SuccessResponse,
)
from app.services.messaging.workspace.access import user_may_access_workspace_conversation
from app.services.messaging.workspace.service import (
    create_conversation,
    get_conversation,
    get_conversation_history,
    list_conversations,
    list_eligible_contacts,
    mark_messages_as_read,
    send_message,
)
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    invalid_request,
    not_found,
    require_authenticated_user,
    server_error,
    unauthorized,
)
from app.utils.security import rate_limit
from app.utils.security.admin_roles import user_has_super_admin_role
from app.utils.validation import validate_request, validate_response


def _parse_kinds() -> list[str] | None:
    raw = request.args.get("kinds") or request.args.get("kind")
    if not raw:
        return None
    return [k.strip() for k in raw.split(",") if k.strip()]


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_workspace_conversations(user):
    if not user.id:
        return unauthorized()
    admin_scope = request.args.get("scope") == "admin"
    if admin_scope and not user_has_super_admin_role(user):
        return forbidden()
    try:
        conversations = list_conversations(user, kinds=_parse_kinds(), admin_scope=admin_scope)
        return jsonify({"success": True, "conversations": conversations})
    except Exception as e:
        return server_error(e, {"function": "get_workspace_conversations"})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreateWorkspaceConversationRequest)
@validate_response(CreateWorkspaceConversationResponse)
def post_workspace_conversation(user, data: CreateWorkspaceConversationRequest):
    if not user.id:
        return unauthorized()
    try:
        conversation = create_conversation(user, data.model_dump(mode="json", exclude_none=True))
        return jsonify({"success": True, "conversation": conversation}), 201
    except ValueError as e:
        msg = str(e)
        if "not available" in msg.lower():
            return jsonify({"success": False, "error": "not_implemented", "message": msg}), 501
        return invalid_request(msg)
    except Exception as e:
        return server_error(e, {"function": "post_workspace_conversation"})


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_workspace_conversation_history(user, conversation_id: str):
    if not user.id:
        return unauthorized()
    conv = get_conversation(conversation_id)
    if not conv:
        return not_found("Conversation not found")
    if not user_may_access_workspace_conversation(user, conv):
        return forbidden()
    try:
        messages = get_conversation_history(conversation_id, user)
        return jsonify({"success": True, "messages": messages})
    except ValueError as e:
        return forbidden(str(e))
    except Exception as e:
        return server_error(e, {"function": "get_workspace_conversation_history"})


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(SendWorkspaceMessageRequest)
@validate_response(SuccessResponse)
def post_workspace_message(user, data: SendWorkspaceMessageRequest):
    if not user.id:
        return unauthorized()
    try:
        result = send_message(
            user,
            conversation_id=str(data.conversation_id),
            message=data.message or "",
        )
        return jsonify({"success": True, **result})
    except ValueError as e:
        if "Access denied" in str(e):
            return forbidden()
        return invalid_request(str(e))
    except Exception as e:
        return server_error(e, {"function": "post_workspace_message"})


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(SuccessResponse)
def post_workspace_mark_read(user, conversation_id: str, data: EmptyRequest | None = None):
    if not user.id:
        return unauthorized()
    conv = get_conversation(conversation_id)
    if not conv:
        return not_found("Conversation not found")
    if not user_may_access_workspace_conversation(user, conv):
        return forbidden()
    try:
        mark_messages_as_read(user, conversation_id)
        return jsonify({"success": True})
    except ValueError as e:
        return forbidden(str(e))
    except Exception as e:
        return server_error(e, {"function": "post_workspace_mark_read"})


@rate_limit(max_requests=40, window_seconds=60, per="user")
@handle_exceptions_with_logging
@require_authenticated_user
def stream_workspace_conversation_events(user):
    if not user.id:
        return unauthorized()
    return Response(
        stream_with_context(_messaging_sse_generator(str(user.id))),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_eligible_contacts(user):
    if not user.id:
        return unauthorized()
    try:
        contacts = list_eligible_contacts(user, kinds=_parse_kinds())
        return jsonify({"success": True, "contacts": contacts})
    except Exception as e:
        return server_error(e, {"function": "get_eligible_contacts"})
