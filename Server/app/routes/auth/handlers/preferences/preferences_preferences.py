"""Preferences CRUD and client preferences handlers."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from flask import jsonify
from sqlalchemy import select

from app import db
from app.models import User
from app.schemas import (
    ClientInfo,
    ClientsPreferencesResponse,
    CreatePreferencesRequest,
    DeletePreferencesApiResponse,
    GetPreferencesApiResponse,
    GetUserPreferencesByIdApiResponse,
    Preference,
    UpsertPreferencesApiResponse,
)
from app.services.aggregation import (
    get_preferences_dict_optional,
    write_preferences_from_payload,
)
from app.services.aggregation.clear_user_preferences import clear_user_preferences
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    standardize_error_response,
)
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.user import User as UserModel


@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(CreatePreferencesRequest)
@validate_response(UpsertPreferencesApiResponse)
def create_or_update_preferences(user: UserModel, data: CreatePreferencesRequest):
    request_data = data.model_dump()
    try:
        preferences = write_preferences_from_payload(str(user.id), request_data, user=user)

        # Phase 2 SIL-183: check if material preference change invalidates BBA approval.
        # Only runs for buyers — agents updating their own prefs are unaffected.
        from app.services.auth.user_role_helpers import user_is_agent
        from app.services.auth.user_role_helpers import user_is_buyer
        if user_is_buyer(user) and preferences:
            try:
                from app.services.transactions.bba_preferences_fingerprint import (
                    invalidate_bba_approval_if_changed,
                )
                invalidate_bba_approval_if_changed(str(user.id), preferences)
            except Exception as e:
                log.error("TRANSACTIONS.BBA_REVIEW", "bba_fingerprint_check_error", e)

        return jsonify(
            {
                "success": True,
                "message": "Preferences saved successfully",
                "preferences": preferences,
            }
        )
    except Exception as e:
        db.session.rollback()
        return server_error(
            e,
            context={
                "function": "create_or_update_preferences",
                "user_id": getattr(user, "id", "unknown"),
            },
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(GetPreferencesApiResponse)
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
        db.session.rollback()
        return server_error(
            e,
            context={
                "function": "get_preferences",
                "user_id": getattr(user, "id", "unknown"),
            },
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(DeletePreferencesApiResponse)
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
        return server_error(
            e,
            context={"function": "delete_preferences", "user_id": str(user.id)},
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(GetUserPreferencesByIdApiResponse)
def get_user_preferences_by_id(user: UserModel, user_id):
    """Get preferences for a specific user by user ID. Used by agents to view client preferences."""
    try:
        if not user_is_agent(user):
            return standardize_error_response(
                "Agent access required",
                status_code=403,
                error_code="FORBIDDEN",
            )
        from app.services.agent.client_service import agent_may_access_client

        target_id = str(user_id).strip()
        if not agent_may_access_client(str(user.id), target_id):
            log.warn(
                "AUTH",
                "preferences_access_denied_not_client",
                {"agent_id": str(user.id), "target_user_id": target_id},
            )
            return standardize_error_response(
                "Access denied: User is not your client",
                status_code=403,
                error_code="FORBIDDEN",
            )
        preferences = get_preferences_dict_optional(user_id)
        return jsonify(
            {
                "success": True,
                "preferences": preferences,
            }
        )
    except Exception as e:
        log.error("AUTH", "fetch_user_preferences_failed", e)
        return server_error(
            e,
            context={
                "function": "get_user_preferences_by_id",
                "user_id": getattr(user, "id", "unknown"),
            },
        )


@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(ClientsPreferencesResponse)
def get_clients_preferences(user: UserModel):
    try:
        from app.services.agent.client_service import get_agent_client_ids

        clients = get_agent_client_ids(str(user.id))
    except (json.JSONDecodeError, TypeError) as e:
        log.error("AUTH", "clients_preferences_parse_failed", e)
        return server_error(
            e,
            context={
                "function": "get_clients_preferences",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
    preferences_out: list[dict] = []
    try:
        for client_id in clients:
            pref = get_preferences_dict_optional(client_id)
            client_user = db.session.scalar(select(User).where(User.id == client_id))
            client_info = None
            if client_user:
                client_info = ClientInfo(
                    id=str(client_user.id),
                    name=client_user.name,
                    email=client_user.email,
                )
            preferences_out.append(
                Preference(client=client_info, preferences=pref).model_dump(mode="json")
            )
        return jsonify({"success": True, "preferences": preferences_out})
    except Exception as e:
        log.error("AUTH", "clients_preferences_fetch_failed", e)
        return server_error(
            e,
            context={
                "function": "get_clients_preferences",
                "user_id": getattr(user, "id", "unknown"),
            },
        )
