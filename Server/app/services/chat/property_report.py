"""Property-report chatbot message flow and history."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import ChatHistory, Document
from app.services.chatbot.chatbot_utils import (
    get_chat_response,
    get_preferences,
    summarize_user_message,
)
from logger import log


def _report_json_s3_key(pdf_doc: Document) -> str:
    pdf_path = pdf_doc.file_path
    if "/" in pdf_path:
        path_parts = pdf_path.split("/")
        if len(path_parts) >= 4 and path_parts[1] == "reports":
            user_id_from_path = path_parts[0]
            report_type = path_parts[2]
            pdf_filename = path_parts[3]
            return (
                f"{user_id_from_path}/json/{report_type}/{pdf_filename.removesuffix('.pdf')}.json"
            )
        return pdf_path.replace("/reports/", "/json/").replace(".pdf", ".json")
    return pdf_path.replace(".pdf", ".json")


def load_report_data(pdf_doc: Document, address: str) -> dict:
    """Load JSON report payload from S3, or a minimal fallback dict."""
    try:
        from app.services.aggregation import _download_json_from_s3

        return _download_json_from_s3(_report_json_s3_key(pdf_doc))
    except Exception as report_error:
        log.warn(
            "MESSAGES",
            "chat_report_data_unavailable",
            {"report_id": str(pdf_doc.id), "error": str(report_error)},
        )
        return {
            "address": address,
            "type": "property_report",
            "status": "completed",
            "error": "Full report data unavailable",
        }


def get_user_report_document(user_id: str, report_id: str) -> Document | None:
    return db.session.scalar(
        select(Document).where(Document.id == report_id, Document.user_id == user_id)
    )


def send_property_report_message(
    user_id: str,
    report_id: str,
    user_message: str,
) -> dict:
    """
    Persist user message, call AI, persist assistant reply, commit.
    Returns response payload for ChatbotResponse schema.
    """
    message_summary = summarize_user_message(user_message)

    pdf_doc = get_user_report_document(user_id, report_id)
    if not pdf_doc:
        raise LookupError("report_not_found")

    address = getattr(pdf_doc, "primary_address", None) or "Unknown Address"
    if not pdf_doc.primary_address:
        log.warn("MESSAGES", "chat_report_missing_primary_address", {"report_id": report_id})

    report_data = load_report_data(pdf_doc, address)
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
    db.session.commit()

    return {
        "response": reply,
        "function_call": function_call,
        "message_id": str(ai_chat.id),
        "message_summary": message_summary,
    }


def get_chat_history_messages(user_id: str, report_id: str) -> list[dict]:
    """Serialize chat history for a property report."""
    chat_history = db.session.scalars(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id, ChatHistory.report_id == report_id)
        .order_by(ChatHistory.timestamp.asc())
    ).all()

    return [
        {
            "id": chat.id,
            "role": chat.role,
            "message": chat.message,
            "timestamp": chat.timestamp.isoformat(),
        }
        for chat in chat_history
    ]
