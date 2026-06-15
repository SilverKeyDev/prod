"""Property-report chatbot routes (send message, fetch history)."""

from flask import Blueprint, jsonify

from app import db
from app.schemas import ChatbotResponse, ChatbotSendRequest
from app.services.chat import get_chat_history_messages, send_property_report_message
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    not_found,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.validation import validate_request, validate_response
from logger import log

chatbot_bp = Blueprint("chatbot", __name__)


@chatbot_bp.route("/api/v1/chat/address/<string:report_id>", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(ChatbotSendRequest)
@validate_response(ChatbotResponse)
def chat_for_address(user, report_id: str, data: ChatbotSendRequest):
    user_id = str(user.id)
    user_message = str(data.message or "").strip()

    if not user_message:
        log.warn("MESSAGES", "chat_empty_message", {"user_id": user_id})
        return validation("Message cannot be empty", field_errors={"message": "Required"})

    try:
        payload = send_property_report_message(user_id, report_id, user_message)
        return jsonify(payload)
    except LookupError:
        log.warn(
            "MESSAGES",
            "chat_report_not_found",
            {"report_id": report_id, "user_id": user_id},
        )
        return not_found()
    except Exception as e:
        db.session.rollback()
        return server_error(
            e,
            context={"function": "chat_for_address", "user_id": user_id, "report_id": report_id},
        )


@chatbot_bp.route("/api/v1/chat/history/<string:report_id>", methods=["GET"])
@handle_exceptions_with_logging
@require_authenticated_user
def get_chat_history(user, report_id: str):
    """Get chat history for a specific property report."""
    return jsonify({"messages": get_chat_history_messages(str(user.id), report_id)})
