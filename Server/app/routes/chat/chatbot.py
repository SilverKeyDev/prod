"""Property-report chatbot routes (send message, fetch history)."""

from flask import Blueprint, jsonify
from sqlalchemy import select

from app import db
from app.models import ChatHistory, Document
from app.schemas import ChatbotResponse, ChatbotSendRequest
from app.services.chatbot.chatbot_utils import (
    get_chat_response,
    get_preferences,
    summarize_user_message,
)
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

    message_summary = summarize_user_message(user_message)

    pdf_doc = db.session.scalar(
        select(Document).where(Document.id == report_id, Document.user_id == user_id)
    )
    if not pdf_doc:
        log.warn(
            "MESSAGES",
            "chat_report_not_found",
            {"report_id": report_id, "user_id": user_id},
        )
        return not_found()

    address = getattr(pdf_doc, "primary_address", None) or "Unknown Address"
    if not pdf_doc.primary_address:
        log.warn("MESSAGES", "chat_report_missing_primary_address", {"report_id": report_id})

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
        log.warn(
            "MESSAGES",
            "chat_report_data_unavailable",
            {"report_id": report_id, "error": str(report_error)},
        )
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
        log.error("MESSAGES", "chat_ai_service_error", ai_error)
        reply = "I'm sorry, the AI service is currently unavailable. Please try again later."
        function_call = None

    ai_chat = ChatHistory(user_id=user_id, report_id=report_id, role="assistant", message=reply)
    db.session.add(ai_chat)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return server_error(
            e,
            context={"function": "chat_for_address", "user_id": user_id, "report_id": report_id},
        )

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
    chat_history = db.session.scalars(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id, ChatHistory.report_id == report_id)
        .order_by(ChatHistory.timestamp.asc())
    ).all()

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
