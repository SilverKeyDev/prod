"""Agent chat/conversation endpoints."""

from datetime import datetime

from flask import jsonify, request

from app.routes.agent.handlers._errors import agent_value_error_response
from app.schemas import (
    CreateConversationRequest,
    CreateConversationResponse,
    EmptyRequest,
    MarkMessagesAsReadResponse,
    SendMessageRequest,
    SendMessageResponse,
    SuccessResponse,
    UpdateEventRequestStatusRequest,
)
from app.services.agent import (
    create_conversation,
    get_conversation,
    get_conversation_history,
    get_conversations,
    mark_messages_as_read,
    update_event_request_status,
)
from app.services.agent import (
    send_message as send_conversation_message,
)
from app.services.agent.client_service import get_user_agent_id
from app.services.agent.conversation_access import user_may_access_conversation
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    forbidden,
    handle_exceptions_with_logging,
    invalid_request,
    not_found,
    require_agent_access,
    require_authenticated_user,
    server_error,
    unauthorized,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log


def _parse_optional_iso_timestamp(value: str | None) -> datetime | None:
    if not value or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as e:
        raise ValueError("Invalid before_timestamp or after_timestamp format") from e


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_chats(user):
    """Get list of conversations for authenticated user (agent or client)"""
    client_id = request.args.get("client_id")
    if not user.id:
        log.error("AUTH", "User ID is None in get_chats")
        return unauthorized()
    conversations = get_conversations(str(user.id), user_is_agent(user))
    if client_id and user_is_agent(user):
        conversations = [c for c in conversations if c.get("client_id") == client_id]
    log.info(
        "API",
        "get_chats",
        {
            "user_id": str(user.id),
            "has_agent_role": user_is_agent(user),
            "filter_client_id": client_id,
            "conversation_count": len(conversations),
        },
    )
    return jsonify({"success": True, "conversations": conversations})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
@validate_request(CreateConversationRequest)
@validate_response(CreateConversationResponse)
def create_chat(user, data: CreateConversationRequest):
    """Create a new conversation between agent and client"""
    try:
        client_id = data.client_id
        conversation = create_conversation(user.id, client_id)
        return jsonify({"success": True, "conversation": conversation}), 201
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "create_chat", "user_id": user.id if user else "unknown"}
        )


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_chat_history(user, conversation_id):
    """Get chat history for a specific conversation"""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            return not_found()
        if not user_may_access_conversation(conversation, str(user.id)):
            return forbidden()
        if not user.id:
            log.error("AUTH", "User ID is None in get_chat_history")
            return unauthorized()
        limit_raw = request.args.get("limit", type=int)
        before_message_id = (request.args.get("before_message_id") or "").strip() or None
        after_message_id = (request.args.get("after_message_id") or "").strip() or None
        try:
            before_timestamp = _parse_optional_iso_timestamp(request.args.get("before_timestamp"))
            after_timestamp = _parse_optional_iso_timestamp(request.args.get("after_timestamp"))
        except ValueError:
            return validation("Invalid before_timestamp or after_timestamp format")
        try:
            history = get_conversation_history(
                conversation_id,
                user_id=str(user.id),
                limit=limit_raw,
                before_timestamp=before_timestamp,
                before_message_id=before_message_id,
                after_timestamp=after_timestamp,
                after_message_id=after_message_id,
            )
        except ValueError as e:
            return agent_value_error_response(e)
        return jsonify({"success": True, **history})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(e, {"function": "get_chat_history", "user_id": str(user.id)})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(SendMessageRequest)
@validate_response(SendMessageResponse)
def send_message(user, data: SendMessageRequest):
    """Send a message in a conversation"""
    try:
        conversation_id = data.conversation_id
        message = data.message
        shared_home_id = data.shared_home_id
        shared_document_id = data.shared_document_id
        client_id_for_new = data.client_id
        log.info(
            "MESSAGES",
            "send_message request",
            {
                "conversation_id": conversation_id,
                "message_length": len(message) if message else 0,
                "has_shared_home": bool(shared_home_id),
                "has_shared_document": bool(shared_document_id),
                "user_id": str(user.id) if user.id else None,
                "has_agent_role": user_is_agent(user),
            },
        )
        if not conversation_id:
            log.warn("MESSAGES", "send_message missing conversation_id")
            return invalid_request("conversation_id is required")
        if message is None or not isinstance(message, str):
            log.warn(
                "MESSAGES",
                "send_message invalid message type",
                {"message_type": str(type(message))},
            )
            return invalid_request("message must be a string")
        has_attachment = bool(shared_home_id or shared_document_id)
        if not message.strip() and not has_attachment:
            log.warn("MESSAGES", "send_message empty message without attachment")
            return invalid_request("message cannot be empty unless sharing a home or document")
        role = "agent" if user_is_agent(user) else "user"
        if not conversation_id or conversation_id == "new":
            if not user.id:
                log.error("AUTH", "User ID is None when creating conversation")
                return unauthorized()
            if user_is_agent(user):
                client_id = client_id_for_new
                if not client_id:
                    return invalid_request("client_id is required to create conversation")
                conversation = create_conversation(str(user.id), str(client_id))
                conversation_id = conversation["id"]
            else:
                agent_id = get_user_agent_id(str(user.id))
                if not agent_id:
                    return invalid_request("No agent assigned. Please contact support.")
                conversation = create_conversation(str(agent_id), str(user.id))
                conversation_id = conversation["id"]
        else:
            if not user.id:
                log.error("AUTH", "User ID is None when checking conversation access")
                return unauthorized()
            conversation = get_conversation(conversation_id)
            if not conversation:
                return not_found()
            if not user_may_access_conversation(conversation, str(user.id)):
                return forbidden()
        if not user.id:
            log.error("AUTH", "User ID is None in send_message")
            return unauthorized()
        result = send_conversation_message(
            conversation_id,
            str(user.id),
            message,
            role,
            shared_home_id=shared_home_id,
            shared_document_id=shared_document_id,
        )
        log.info(
            "MESSAGES",
            "send_message succeeded",
            {"conversation_id": conversation_id, "user_id": str(user.id)},
        )
        return jsonify({"success": True, "message_id": result["message_id"]})
    except ValueError as e:
        log.warn("MESSAGES", "Validation error in send_message", {"error": str(e)})
        return agent_value_error_response(e)
    except Exception as e:
        log.error("ERRORS", "Error in send_message", e)
        return server_error(
            e, {"function": "send_message", "user_id": str(getattr(user, "id", ""))}
        )


@rate_limit(max_requests=60, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(UpdateEventRequestStatusRequest)
@validate_response(SuccessResponse)
def update_event_request_status_route(user, message_id, data: UpdateEventRequestStatusRequest):
    """Update event request status (accepted or cancelled) for a calendar event request message."""
    try:
        if not user.id:
            return unauthorized()
        status = data.status
        update_event_request_status(str(message_id), str(user.id), status)
        return jsonify({"success": True})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        log.error("ERRORS", "Error in update_event_request_status", e)
        return server_error(
            e, {"function": "update_event_request_status", "user_id": str(getattr(user, "id", ""))}
        )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(MarkMessagesAsReadResponse)
def mark_chat_as_read(user, conversation_id, data: EmptyRequest | None = None):
    """Mark all messages in a conversation as read"""
    if not user.id:
        log.error("AUTH", "User ID is None in mark_chat_as_read")
        return unauthorized()
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            return not_found()
        if not user_may_access_conversation(conversation, str(user.id)):
            return forbidden()
        result = mark_messages_as_read(conversation_id, str(user.id))
        return jsonify({"success": True, **result})
    except ValueError as e:
        return agent_value_error_response(e)
    except Exception as e:
        return server_error(
            e, {"function": "mark_chat_as_read", "user_id": getattr(user, "id", "unknown")}
        )
