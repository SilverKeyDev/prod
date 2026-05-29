"""Property-report chatbot routes (send message, fetch history)."""

from flask import Blueprint, jsonify, request

from app import db
from app.models import ChatHistory, Document
from app.schemas import ChatbotResponse, ChatbotSendRequest
from app.services.chatbot.chatbot_utils import (
    get_chat_response,
    get_preferences,
    summarize_user_message,
)
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_request, validate_response

logger = get_logger()

chatbot_bp = Blueprint("chatbot", __name__)


@chatbot_bp.route("/api/v1/chat/address/<string:report_id>", methods=["POST"])
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(ChatbotSendRequest)
@validate_response(ChatbotResponse)
def chat_for_address(user, report_id: str, data: ChatbotSendRequest | None = None):
    user_id = str(user.id)

    if data is None:
        raw = request.get_json(silent=True) or {}
        user_message = str(raw.get("message") or "").strip()
    else:
        user_message = str(data.message or "").strip()

    if not user_message:
        logger.warning(f"[CHAT_ROUTE] Empty message received from user {user_id}")
        return jsonify({"error": "Message cannot be empty"}), 400

    message_summary = summarize_user_message(user_message)

    pdf_doc = Document.query.filter_by(id=report_id, user_id=user_id).first()
    if not pdf_doc:
        logger.warning(
            f"[CHAT_ROUTE] PDF document not found for report_id: {report_id}, user_id: {user_id}"
        )
        return jsonify({"error": f"Report not found: {report_id}"}), 404

    address = getattr(pdf_doc, "primary_address", None) or "Unknown Address"
    if not pdf_doc.primary_address:
        logger.warning(f"[CHAT_ROUTE] PDF document {report_id} has no primary_address set")

    report_data = None
    try:
        pdf_path = pdf_doc.file_path
        if "/" in pdf_path:
            path_parts = pdf_path.split("/")
            if len(path_parts) >= 4 and path_parts[1] == "reports":
                user_id_from_path = path_parts[0]
                report_type = path_parts[2]
                pdf_filename = path_parts[3]
                json_s3_key = f"{user_id_from_path}/json/{report_type}/{pdf_filename.removesuffix('.pdf')}.json"
            else:
                json_s3_key = pdf_path.replace("/reports/", "/json/").replace(".pdf", ".json")
        else:
            json_s3_key = pdf_path.replace(".pdf", ".json")

        from app.services.aggregation import _download_json_from_s3

        report_data = _download_json_from_s3(json_s3_key)
    except Exception as report_error:
        logger.warning(f"[CHAT_ROUTE] Failed to fetch full report data: {str(report_error)}")
        report_data = {
            "address": address,
            "type": "property_report",
            "status": "completed",
            "error": "Full report data unavailable",
        }

    user_profile = get_preferences(user_id)

    user_chat = ChatHistory(user_id=user_id, report_id=report_id, role="user", message=user_message)
    db.session.add(user_chat)
    db.session.flush()

    try:
        reply, function_call = get_chat_response(
            report_data=report_data,
            user_profile=user_profile,
            user_message=user_message,
            address=address,
        )
    except Exception as ai_error:
        logger.error(f"[CHAT_ROUTE] AI service error: {str(ai_error)}")
        reply = "I'm sorry, the AI service is currently unavailable. Please try again later."
        function_call = None

    ai_chat = ChatHistory(user_id=user_id, report_id=report_id, role="assistant", message=reply)
    db.session.add(ai_chat)
    db.session.commit()

    return jsonify(
        {
            "response": reply,
            "function_call": function_call,
            "message_id": str(ai_chat.id),
            "message_summary": message_summary,
        }
    )


@chatbot_bp.route("/api/v1/chat/history/<string:report_id>", methods=["GET"])
@handle_exceptions_with_logging
@require_authenticated_user
def get_chat_history(user, report_id: str):
    """Get chat history for a specific property report."""
    user_id = str(user.id)
    chat_history = (
        ChatHistory.query.filter_by(user_id=user_id, report_id=report_id)
        .order_by(ChatHistory.timestamp.asc())
        .all()
    )

    messages = [
        {
            "id": chat.id,
            "role": chat.role,
            "message": chat.message,
            "timestamp": chat.timestamp.isoformat(),
        }
        for chat in chat_history
    ]

    return jsonify({"messages": messages})
