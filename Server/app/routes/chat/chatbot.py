# routes/chatbot.py

import traceback

from flask import Blueprint, jsonify, request

from app.models import ChatHistory
from app.services.auth import get_current_user
from app.services.chatbot.chatbot_utils import (
    get_chat_response,
    get_preferences,
    summarize_user_message,
)

from ... import db
from ...utils.security.app_logging import get_logger

logger = get_logger()


# Authentication handled directly in route functions

chatbot_bp = Blueprint("chatbot", __name__)


@chatbot_bp.route("/api/v1/chat/address/<string:report_id>", methods=["POST"])
def chat_for_address(report_id):
    try:
        try:
            user = get_current_user()
            user_id = user.id
        except Exception as auth_error:
            logger.error(f"[CHAT_ROUTE] Authentication failed: {str(auth_error)}")
            return jsonify({"error": "Authentication required"}), 401

        user_message = request.json.get("message", "").strip() if request.json else ""

        if not user_message:
            logger.warning(f"[CHAT_ROUTE] Empty message received from user {user_id}")
            return jsonify({"error": "Message cannot be empty"}), 400

        message_summary = summarize_user_message(user_message)

        # Fetch the PDF document from the database to get the correct address and S3 path
        from app.models import Document

        pdf_doc = Document.query.filter_by(id=report_id, user_id=user_id).first()

        if not pdf_doc:
            logger.warning(
                f"[CHAT_ROUTE] PDF document not found for report_id: {report_id}, user_id: {user_id}"
            )
            return jsonify({"error": f"Report not found: {report_id}"}), 404

        # Use the primary_address from the database record as the source of truth
        address = getattr(pdf_doc, "primary_address", None) or "Unknown Address"

        if not pdf_doc.primary_address:
            logger.warning(f"[CHAT_ROUTE] PDF document {report_id} has no primary_address set")

        # Fetch complete report data from S3
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

        # Fetch complete user preferences
        user_profile = get_preferences(user_id)

        user_chat = ChatHistory(
            user_id=user_id, report_id=report_id, role="user", message=user_message
        )
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
                "message_id": ai_chat.id,
                "message_summary": message_summary,
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"[CHAT_ROUTE] Error in chat_for_address for report {report_id}: {str(e)}")
        logger.error(f"[CHAT_ROUTE] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500


@chatbot_bp.route("/api/v1/chat/history/<string:report_id>", methods=["GET"])
def get_chat_history(report_id):
    """Get chat history for a specific property report"""
    try:
        # Authenticate user first
        try:
            user = get_current_user()
            user_id = user.id
        except Exception as auth_error:
            logger.error(f"[HISTORY_ROUTE] Authentication failed: {str(auth_error)}")
            return jsonify({"error": "Authentication required"}), 401

        # Get chat history for this user and report
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

    except Exception as e:
        logger.error(f"[HISTORY_ROUTE] Error getting chat history for report {report_id}: {str(e)}")
        logger.error(f"[HISTORY_ROUTE] Exception type: {type(e).__name__}")
        logger.error(f"[HISTORY_ROUTE] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500
