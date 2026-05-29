"""Preferences CRUD and client preferences handlers."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from flask import current_app, jsonify, request

from app import db
from app.dtos.user import UserDTO
from app.models import User
from app.schemas import CreatePreferencesRequest
from app.services.aggregation import (
    get_preferences_dict_optional,
    write_preferences_from_payload,
)
from app.services.aggregation.clear_user_preferences import clear_user_preferences
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_request

if TYPE_CHECKING:
    from app.models.user import User as UserModel

logger = get_logger()


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreatePreferencesRequest)
def create_or_update_preferences(user: UserModel, data: CreatePreferencesRequest | None = None):
    log = current_app.logger
    try:
        if data is not None:
            request_data = data.model_dump()
        else:
            request_data = request.get_json()
            if not request_data:
                log.warning("No JSON data received in request body")
                return jsonify({"success": False, "error": "No data provided"}), 400
    except Exception as e:
        log.error("Failed to parse JSON body: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Invalid JSON format"}), 400
    try:
        preferences = write_preferences_from_payload(str(user.id), request_data, user=user)
        return jsonify(
            {
                "success": True,
                "message": "Preferences saved successfully",
                "preferences": preferences,
            }
        )
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e,
            {"function": "create_or_update_preferences", "user_id": getattr(user, "id", "unknown")},
        )


@handle_exceptions_with_logging
@require_authenticated_user
def get_preferences(user: UserModel):
    try:
        preferences = get_preferences_dict_optional(str(user.id))
        return jsonify(
            {
                "success": True,
                "preferences": preferences,
                "has_preferences": preferences is not None,
            }
        )
    except Exception as e:
        return SecureErrorHandler.handle_database_error(
            e, {"function": "get_preferences", "user_id": getattr(user, "id", "unknown")}
        )


@handle_exceptions_with_logging
@require_authenticated_user
def delete_preferences(user: UserModel):
    """Clear all preference rows for the authenticated user only."""
    try:
        clear_user_preferences(str(user.id), user=user)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "has_preferences": False,
                "preferences": None,
                "message": "Preferences cleared successfully",
            }
        )
    except Exception as e:
        db.session.rollback()
        return SecureErrorHandler.handle_database_error(
            e,
            {"function": "delete_preferences", "user_id": str(user.id)},
        )


@handle_exceptions_with_logging
@require_authenticated_user
def get_user_preferences_by_id(user: UserModel, user_id):
    """Get preferences for a specific user by user ID. Used by agents to view client preferences."""
    try:
        if not user.is_agent:
            return jsonify({"success": False, "error": "Agent access required"}), 403
        from app.services.agent.client_service import agent_may_access_client

        target_id = str(user_id).strip()
        if not agent_may_access_client(str(user.id), target_id):
            logger.warning(
                "Agent %s attempted to access preferences for user %s who is not their client",
                user.id,
                target_id,
            )
            return jsonify(
                {"success": False, "error": "Access denied: User is not your client"}
            ), 403
        preferences = get_preferences_dict_optional(user_id)
        return jsonify(
            {
                "success": True,
                "preferences": preferences,
            }
        )
    except Exception as e:
        logger.error("Failed to fetch user preferences: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to get user preferences"}), 500


@handle_exceptions_with_logging
@require_authenticated_user
def get_clients_preferences(user: UserModel):
    log = current_app.logger
    try:
        from app.services.agent.client_service import get_agent_client_ids

        clients = get_agent_client_ids(str(user.id))
    except (json.JSONDecodeError, TypeError) as e:
        log.error("Failed to parse client IDs JSON: %s", str(e), exc_info=True)
        return jsonify({"success": True, "preferences": [], "has_preferences": False}), 500
    preferences_list = []
    user_list = []
    try:
        for client_id in clients:
            pref = get_preferences_dict_optional(client_id)
            client_user = User.query.filter_by(id=client_id).first()
            if pref is not None:
                preferences_list.append(pref)
            if client_user:
                user_list.append(UserDTO.to_list_response(client_user))
        return jsonify(
            {"success": True, "preferences": preferences_list, "user_information": user_list}
        )
    except Exception as e:
        log.error("Failed to fetch client preferences from DB: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Failed to get client preferences"}), 500
