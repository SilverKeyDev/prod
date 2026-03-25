"""Favorite homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import HomeUniversal
from app.services.search.db.search_db import add_or_update_home_basic, sync_to_home_likes
from app.utils.address_format import normalize_address, safe_normalize_address
from app.utils.common_patterns import require_authenticated_user, resolve_agent_scoped_user_id

if TYPE_CHECKING:
    from app.models.user import User


@require_authenticated_user
def favorite_homes(user: User) -> Response | tuple[Response, int]:
    """Retrieve or replace the user's list of favorite home IDs. GET returns favorites and listings; POST overwrites list."""
    if request.method == "GET":
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]
        liked_homes = HomeUniversal.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        all_homes = HomeUniversal.query.filter_by(user_id=str(target_uid), current=True).all()
        favorites = [home.to_dict() for home in liked_homes]
        listings = [home.to_dict() for home in all_homes]
        return jsonify({"success": True, "favorites": favorites, "listings": listings})
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]
        existing = HomeUniversal.query.filter_by(user_id=str(target_uid), current=True).all()
        for h in existing:
            was_liked = h.is_liked
            h.is_liked = False
            if was_liked:
                sync_to_home_likes(h, action="unliked")
        existing_by_norm = {}
        for h in existing:
            if h.address:
                try:
                    existing_by_norm[normalize_address(h.address)] = h
                except Exception:
                    existing_by_norm[h.address.strip().lower()] = h
        for home in data:
            try:
                add_or_update_home_basic(user_id=str(target_uid), home=home, set_liked=True)
            except Exception as e:
                current_app.logger.warning(
                    "[FAVORITES] Skipped invalid home during bulk like: %s", e
                )
        db.session.commit()
        liked_homes = HomeUniversal.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [home.to_dict() for home in liked_homes]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to update favorite homes: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def add_favorite_home(user: User) -> Response | tuple[Response, int]:
    """Add a single home to the user's favorites list and store full home data in home_universal."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "error": "Expected JSON object"}), 400
        target_uid, scope_err = resolve_agent_scoped_user_id(user, data)
        if scope_err:
            return scope_err[0], scope_err[1]
        home = data.get("home")
        if not home or not isinstance(home, dict):
            return jsonify({"success": False, "error": "Home object is required"}), 400
        address = home.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        add_or_update_home_basic(user_id=str(target_uid), home=home, set_liked=True)
        liked_homes = HomeUniversal.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [h.to_dict() for h in liked_homes]
        return jsonify(
            {"success": True, "message": "Home added to favorites", "favorites": favorites}
        )
    except Exception as e:
        current_app.logger.error("Failed to add favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def remove_favorite_home(user: User) -> Response | tuple[Response, int]:
    """Unlike a single home by setting is_liked to False on all rows for that address."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, dict):
            return jsonify({"success": False, "error": "Expected JSON object"}), 400
        target_uid, scope_err = resolve_agent_scoped_user_id(user, data)
        if scope_err:
            return scope_err[0], scope_err[1]
        address = data.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        normalized_target = safe_normalize_address(address)
        # Find ALL rows for this user that match the address (current and non-current).
        # GET returns only current=True + is_liked=True; we must unlike every matching row
        # so that the "current" row is updated and no duplicate address rows stay liked.
        matching = []
        for h in HomeUniversal.query.filter_by(user_id=str(target_uid)).all():
            if not h.address:
                continue
            try:
                norm_existing = normalize_address(h.address)
            except Exception:
                norm_existing = h.address.strip().lower()
            if norm_existing == normalized_target:
                matching.append(h)
        if not matching:
            return jsonify({"success": False, "error": "Home not found in favorites"}), 404
        for existing_home in matching:
            if existing_home.is_liked:
                sync_to_home_likes(existing_home, action="unliked")
            existing_home.is_liked = False
        db.session.commit()
        # Return only liked homes as favorites (same shape as GET).
        liked_homes = HomeUniversal.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [h.to_dict() for h in liked_homes]
        return jsonify({"success": True, "message": "Home unliked", "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to remove favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500
