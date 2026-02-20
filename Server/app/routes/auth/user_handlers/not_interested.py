"""Not-interested homes handlers."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import HomeNotInterested, HomeUniversal
from app.services.search.db.search_db import add_or_update_home_basic, sync_to_home_not_interested
from app.utils.address_format import normalize_address, safe_normalize_address
from app.utils.common_patterns import require_authenticated_user

if TYPE_CHECKING:
    from app.models.user import User


@require_authenticated_user
def not_interested_homes(user: User) -> Response | tuple[Response, int]:
    """Retrieve the user's list of not-interested homes."""
    if request.method == "GET":
        homes = HomeNotInterested.query.filter_by(
            user_id=str(user.id), is_not_interested=True
        ).all()
        return jsonify({"success": True, "notInterested": [home.to_dict() for home in homes]})
    return jsonify({"success": False, "error": "Method not allowed"}), 405
    return jsonify({"success": False, "error": "Method not allowed"}), 405


@require_authenticated_user
def add_not_interested_home(user: User) -> Response | tuple[Response, int]:
    """Mark a single home as not interested."""
    try:
        data = request.get_json(force=True)
        home = data.get("home")
        if not home or not isinstance(home, dict):
            return jsonify({"success": False, "error": "Home object is required"}), 400
        address = home.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        home_record = add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=False)
        why = data.get("why")
        if why and isinstance(why, str):
            why = why.strip() or None
        else:
            why = None
        sync_to_home_not_interested(home_record, action="not_interested", why=why)
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
def remove_not_interested_home(user: User) -> Response | tuple[Response, int]:
    """Undo not-interested status for a single home."""
    try:
        data = request.get_json(force=True)
        address = data.get("address")
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
        home_universal = None
        for h in HomeUniversal.query.filter_by(user_id=str(user.id)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                home_universal = h
                break
        existing_home.is_not_interested = False
        db.session.commit()
        if home_universal:
            sync_to_home_not_interested(home_universal, action="undo")
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
def update_not_interested_home(user: User) -> Response | tuple[Response, int]:
    """Update the reason for a not-interested home."""
    try:
        data = request.get_json(force=True)
        address = data.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        why = data.get("why")
        if not why or not isinstance(why, str):
            return jsonify({"success": False, "error": "Why is required and must be a string"}), 400
        why = why.strip()
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
                {"timestamp": datetime.utcnow().isoformat(), "action": "not_interested", "why": why}
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
