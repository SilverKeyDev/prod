"""Workspace conversations API blueprint."""

from flask import Blueprint

from .handlers.conversations import (
    get_eligible_contacts,
    get_workspace_conversation_history,
    get_workspace_conversations,
    post_workspace_conversation,
    post_workspace_mark_read,
    post_workspace_message,
    stream_workspace_conversation_events,
)

conversations_bp = Blueprint("conversations", __name__, url_prefix="/api/v1/conversations")

conversations_bp.route("", methods=["GET"])(get_workspace_conversations)
conversations_bp.route("", methods=["POST"])(post_workspace_conversation)
conversations_bp.route("/stream", methods=["GET"])(stream_workspace_conversation_events)
conversations_bp.route("/eligible-contacts", methods=["GET"])(get_eligible_contacts)
conversations_bp.route("/<conversation_id>/history", methods=["GET"])(
    get_workspace_conversation_history
)
conversations_bp.route("/message", methods=["POST"])(post_workspace_message)
conversations_bp.route("/<conversation_id>/read", methods=["POST"])(post_workspace_mark_read)
