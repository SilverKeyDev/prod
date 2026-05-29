"""Not-interested homes handlers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import HomeNotInterested, PropertyCache, UserPropertyLink
from app.schemas import (
    AddNotInterestedRequest,
    NotInterestedHomesResponse,
    RemoveNotInterestedRequest,
    UpdateNotInterestedRequest,
)
from app.services.search.db import add_or_update_home_basic, sync_to_home_not_interested
from app.utils.common_patterns import require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address, safe_normalize_address
from app.utils.validation import validate_request, validate_response

if TYPE_CHECKING:
    from app.models.user import User


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
def not_interested_homes(user: User) -> Response | tuple[Response, int]:
    """Retrieve the user's list of not-interested homes."""
    homes = HomeNotInterested.query.filter_by(user_id=str(user.id), is_not_interested=True).all()
    return jsonify({"success": True, "notInterested": [home.to_dict() for home in homes]})


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(AddNotInterestedRequest)
def add_not_interested_home(
    user: User, data: AddNotInterestedRequest | None = None
) -> Response | tuple[Response, int]:
    """Mark a single home as not interested."""
    try:
        if data is not None:
            payload = data.model_dump(mode="json", by_alias=True)
        else:
            payload = request.get_json(force=True) or {}
        home = payload.get("home")
        if not home or not isinstance(home, dict):
            return jsonify({"success": False, "error": "Home object is required"}), 400
        address = home.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        link = add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=False)
        prop = get_model(PropertyCache, link.property_id)
        why = payload.get("why")
        if why and isinstance(why, str):
            why = why.strip() or None
        else:
            why = None
        sync_to_home_not_interested(link, prop, action="not_interested", why=why)
        homes = HomeNotInterested.query.filter_by(
            user_id=str(user.id), is_not_interested=True
        ).all()
        not_interested = [h.to_dict() for h in homes]
        return jsonify(
            {
                "success": True,
                "message": "Home marked as not interested",
                "notInterested": not_interested,
            }
        )
    except Exception as e:
        current_app.logger.error("Failed to add not-interested home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(RemoveNotInterestedRequest)
def remove_not_interested_home(
    user: User, data: RemoveNotInterestedRequest | None = None
) -> Response | tuple[Response, int]:
    """Undo not-interested status for a single home."""
    try:
        if data is not None:
            address = data.address
        else:
            request_data = request.get_json(force=True) or {}
            address = request_data.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        normalized_target = safe_normalize_address(address)
        existing_home = None
        for h in HomeNotInterested.query.filter_by(user_id=str(user.id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                existing_home = h
                break
        if not existing_home:
            return jsonify(
                {"success": False, "error": "Home not found in not-interested list"}
            ), 404

        # Find the PropertyCache + UserPropertyLink for undo sync
        prop = _find_property_by_address(normalized_target)
        link = None
        if prop:
            link = UserPropertyLink.query.filter_by(
                user_id=str(user.id), property_id=prop.id
            ).first()

        existing_home.is_not_interested = False
        db.session.commit()

        if link and prop:
            sync_to_home_not_interested(link, prop, action="undo")

        homes = HomeNotInterested.query.filter_by(
            user_id=str(user.id), is_not_interested=True
        ).all()
        not_interested = [h.to_dict() for h in homes]
        return jsonify(
            {
                "success": True,
                "message": "Home removed from not-interested list",
                "notInterested": not_interested,
            }
        )
    except Exception as e:
        current_app.logger.error("Failed to remove not-interested home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(UpdateNotInterestedRequest)
def update_not_interested_home(
    user: User, data: UpdateNotInterestedRequest | None = None
) -> Response | tuple[Response, int]:
    """Update the reason for a not-interested home."""
    try:
        if data is not None:
            address = data.address
            why = data.why.strip() if isinstance(data.why, str) else ""
        else:
            request_data = request.get_json(force=True) or {}
            address = request_data.get("address")
            why_raw = request_data.get("why")
            if not why_raw or not isinstance(why_raw, str):
                return jsonify(
                    {"success": False, "error": "Why is required and must be a string"}
                ), 400
            why = why_raw.strip()
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        if not why:
            return jsonify({"success": False, "error": "Why cannot be empty"}), 400
        normalized_target = safe_normalize_address(address)
        existing_home = None
        for h in HomeNotInterested.query.filter_by(user_id=str(user.id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                existing_home = h
                break
        if not existing_home:
            return jsonify(
                {"success": False, "error": "Home not found in not-interested list"}
            ), 404
        existing_home.why = why
        if existing_home.not_interested_history is None:
            existing_home.not_interested_history = []
        updated = False
        for entry in reversed(existing_home.not_interested_history):
            if entry.get("action") == "not_interested":
                entry["why"] = why
                updated = True
                break
        if not updated:
            existing_home.not_interested_history.append(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "action": "not_interested",
                    "why": why,
                }
            )
        db.session.commit()
        homes = HomeNotInterested.query.filter_by(
            user_id=str(user.id), is_not_interested=True
        ).all()
        not_interested = [h.to_dict() for h in homes]
        return jsonify(
            {
                "success": True,
                "message": "Not-interested reason updated",
                "notInterested": not_interested,
            }
        )
    except Exception as e:
        current_app.logger.error("Failed to update not-interested home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


def _find_property_by_address(normalized_address: str) -> PropertyCache | None:
    """Look up a PropertyCache record by normalized address."""
    return PropertyCache.query.filter_by(address_normalized=normalized_address).first()
