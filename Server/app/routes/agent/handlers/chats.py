"""Agent chat/conversation endpoints."""

import json
import logging

from flask import jsonify, request
from jose.exceptions import ExpiredSignatureError, JWTError

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
from app.services.auth import SecurityException, get_current_user
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_agent_access,
    require_authenticated_user,
)
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import SecurityError, rate_limit, security_error_response

logger = logging.getLogger(__name__)


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_chats(user):
    """Get list of conversations for authenticated user (agent or client)"""
    client_id = request.args.get("client_id")
    if not user.id:
        logger.error("User ID is None in get_chats")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    conversations = get_conversations(str(user.id), bool(user.is_agent))
    if client_id and user.is_agent:
        conversations = [c for c in conversations if c.get("client_id") == client_id]
    return jsonify({"success": True, "conversations": conversations})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_agent_access
def create_chat(user):
    """Create a new conversation between agent and client"""
    try:
        data = request.get_json(force=True)
        client_id = data.get("client_id")
        if not client_id:
            return jsonify({"success": False, "error": "client_id is required"}), 400
        conversation = create_conversation(user.id, client_id)
        return jsonify({"success": True, "conversation": conversation}), 201
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "create_chat", "user_id": user.id if user else "unknown"}
        )


@rate_limit(max_requests=200, window_seconds=60)
def get_chat_history(conversation_id):
    """Get chat history for a specific conversation"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        conversation = get_conversation(conversation_id)
        if not conversation:
            return jsonify({"success": False, "error": "Conversation not found"}), 404
        if conversation["agent_id"] != user.id and conversation["client_id"] != user.id:
            return jsonify({"success": False, "error": "Access denied"}), 403
        if not user.id:
            logger.error("User ID is None in get_chat_history")
            return jsonify({"success": False, "error": "Invalid user session"}), 401
        history = get_conversation_history(conversation_id, user_id=str(user.id))
        return jsonify({"success": True, **history})
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "get_chat_history", "user_id": "unknown"}
        )


@rate_limit(max_requests=100, window_seconds=60)
def send_message():
    """Send a message in a conversation"""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        data = request.get_json(force=True)
        conversation_id = data.get("conversation_id")
        message = data.get("message")
        shared_home_id = data.get("shared_home_id")
        shared_document_id = data.get("shared_document_id")
        logger.info(
            f"[SEND_MESSAGE] Request data: conversation_id={conversation_id}, "
            f"message_length={len(message) if message else 0}, "
            f"has_shared_home={bool(shared_home_id)}, "
            f"has_shared_document={bool(shared_document_id)}, "
            f"user_id={user.id}, is_agent={user.is_agent}"
        )
        if not conversation_id:
            logger.warning("[SEND_MESSAGE] Missing conversation_id")
            return jsonify({"success": False, "error": "conversation_id is required"}), 400
        if message is None or not isinstance(message, str):
            logger.warning(f"[SEND_MESSAGE] Invalid message type: {type(message)}")
            return jsonify({"success": False, "error": "message must be a string"}), 400
        has_attachment = bool(shared_home_id or shared_document_id)
        if not message.strip() and not has_attachment:
            logger.warning("[SEND_MESSAGE] Empty message without attachment")
            return jsonify(
                {
                    "success": False,
                    "error": "message cannot be empty unless sharing a home or document",
                }
            ), 400
        role = "agent" if user.is_agent else "user"
        if not conversation_id or conversation_id == "new":
            if not user.id:
                logger.error("User ID is None when creating conversation")
                return jsonify({"success": False, "error": "Invalid user session"}), 401
            if user.is_agent:
                client_id = data.get("client_id")
                if not client_id:
                    return jsonify(
                        {"success": False, "error": "client_id is required to create conversation"}
                    ), 400
                conversation = create_conversation(str(user.id), str(client_id))
                conversation_id = conversation["id"]
            else:
                agent_id = None
                if user.agent_id:
                    try:
                        agent_ids = (
                            json.loads(user.agent_id)
                            if isinstance(user.agent_id, str)
                            else user.agent_id
                        )
                        agent_id = (
                            agent_ids[0]
                            if isinstance(agent_ids, list) and len(agent_ids) > 0
                            else (agent_ids if isinstance(agent_ids, str) else None)
                        )
                    except Exception:
                        agent_id = user.agent_id.split(",")[0] if user.agent_id else None
                if not agent_id:
                    return jsonify(
                        {"success": False, "error": "No agent assigned. Please contact support."}
                    ), 400
                conversation = create_conversation(str(agent_id), str(user.id))
                conversation_id = conversation["id"]
        else:
            if not user.id:
                logger.error("User ID is None when checking conversation access")
                return jsonify({"success": False, "error": "Invalid user session"}), 401
            conversation = get_conversation(conversation_id)
            if not conversation:
                return jsonify({"success": False, "error": "Conversation not found"}), 404
            if str(conversation["agent_id"]) != str(user.id) and str(
                conversation["client_id"]
            ) != str(user.id):
                return jsonify({"success": False, "error": "Access denied"}), 403
        if not user.id:
            logger.error("User ID is None in send_message")
            return jsonify({"success": False, "error": "Invalid user session"}), 401
        result = send_conversation_message(
            conversation_id,
            str(user.id),
            message,
            role,
            shared_home_id=shared_home_id,
            shared_document_id=shared_document_id,
        )
        logger.info(
            f"Message sent successfully in conversation {conversation_id} by user {user.id}"
        )
        return jsonify({"success": True, "message_id": result["message_id"]})
    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        logger.warning(f"Authentication error in send_message: {str(e)}")
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except ValueError as e:
        logger.warning(f"Validation error in send_message: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_database_error(
            e, {"function": "send_message", "user_id": "unknown"}
        )


@rate_limit(max_requests=60, window_seconds=60)
def update_event_request_status_route(message_id):
    """Update event request status (accepted or cancelled) for a calendar event request message."""
    try:
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        if not user.id:
            return jsonify({"success": False, "error": "Invalid user session"}), 401
        data = request.get_json(force=True) or {}
        status = data.get("status")
        if status not in ("accepted", "cancelled"):
            return jsonify(
                {"success": False, "error": "status must be 'accepted' or 'cancelled'"}
            ), 400
        update_event_request_status(str(message_id), str(user.id), status)
        return jsonify({"success": True})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error in update_event_request_status: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_database_error(
            e, {"function": "update_event_request_status", "user_id": "unknown"}
        )


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def mark_chat_as_read(user, conversation_id):
    """Mark all messages in a conversation as read"""
    if not user.id:
        logger.error("User ID is None in mark_chat_as_read")
        return jsonify({"success": False, "error": "Invalid user session"}), 401
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            return jsonify({"success": False, "error": "Conversation not found"}), 404
        if str(conversation["agent_id"]) != str(user.id) and str(conversation["client_id"]) != str(
            user.id
        ):
            return jsonify({"success": False, "error": "Access denied"}), 403
        result = mark_messages_as_read(conversation_id, str(user.id))
        return jsonify({"success": True, **result})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "mark_chat_as_read", "user_id": getattr(user, "id", "unknown")}
        )
