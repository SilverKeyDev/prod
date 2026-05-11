"""Preferences CRUD and client preferences handlers."""

import json

from flask import current_app, jsonify, request

from app.dtos.user import UserDTO
from app.models import User
from app.schemas import CreatePreferencesRequest
from app.services.aggregation import (
    get_preferences_dict_optional,
    write_preferences_from_payload,
)
from app.services.auth import SecurityException, get_current_user
from app.utils.security.app_logging import get_logger
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.security.security import security_error_response
from app.utils.validation import validate_request

logger = get_logger()


@validate_request(CreatePreferencesRequest)
def create_or_update_preferences(data: CreatePreferencesRequest | None = None):
    log = current_app.logger
    try:
        user = get_current_user()
        if not user:
            log.warning("Unauthorized request: user not found in token")
            return jsonify({"error": "Unauthorized", "success": False}), 401
    except SecurityException as se:
        log.warning("Security exception in create_or_update_preferences: %s", se.error_tuple)
        return security_error_response(se.error_tuple)
    except Exception as e:
        log.error("Failed to get current user: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Authorization failure"}), 500
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


def get_preferences():
    log = current_app.logger
    try:
        user = get_current_user()
        if not user:
            log.warning("Unauthorized request: user not found in token")
            return jsonify({"error": "Unauthorized", "success": False}), 401
    except SecurityException as se:
        log.warning("Security exception in get_preferences: %s", se.error_tuple)
        return security_error_response(se.error_tuple)
    except Exception as e:
        log.error("Failed to get current user: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Authorization failure"}), 500
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


def get_user_preferences_by_id(user_id):
    """Get preferences for a specific user by user ID. Used by agents to view client preferences."""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        if not hasattr(current_user, "client_ids") or not current_user.client_ids:
            logger.warning("Agent %s has no clients assigned", current_user.id)
            return jsonify({"success": False, "error": "No clients assigned to this agent"}), 403
        try:
            client_ids = (
                json.loads(current_user.client_ids)
                if isinstance(current_user.client_ids, str)
                else current_user.client_ids
            )
        except (json.JSONDecodeError, TypeError):
            client_ids = []
        if user_id not in client_ids:
            logger.warning(
                "Agent %s attempted to access preferences for user %s who is not their client",
                current_user.id,
                user_id,
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


def get_clients_preferences():
    log = current_app.logger
    try:
        user = get_current_user()
        if not user:
            log.warning("Unauthorized request: user not found in token")
            return jsonify({"error": "Unauthorized", "success": False}), 401
    except SecurityException as e:
        return security_error_response(e.error_tuple)
    except Exception as e:
        log.error("Failed to get current user: %s", str(e), exc_info=True)
        return jsonify({"success": False, "error": "Authorization failure"}), 500
    try:
        if user.client_ids:
            clients = (
                json.loads(user.client_ids) if isinstance(user.client_ids, str) else user.client_ids
            )
        else:
            clients = []
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
