"""Favorite homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import HomeUniversal
from app.services.search.db.search_db import add_or_update_home_basic, sync_to_home_likes
from app.utils.address_format import normalize_address, safe_normalize_address
from app.utils.common_patterns import require_authenticated_user

if TYPE_CHECKING:
    from app.models.user import User


@require_authenticated_user
def favorite_homes(user: User) -> Response | tuple[Response, int]:
    """Retrieve or replace the user's list of favorite home IDs. GET returns favorites and listings; POST overwrites list."""
    if request.method == "GET":
        liked_homes = HomeUniversal.query.filter_by(
            user_id=str(user.id), is_liked=True, current=True
        ).all()
        all_homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
        favorites = [home.to_dict() for home in liked_homes]
        listings = [home.to_dict() for home in all_homes]
        return jsonify({"success": True, "favorites": favorites, "listings": listings})
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        existing = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
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
                add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=True)
            except Exception as e:
                current_app.logger.warning(
                    "[FAVORITES] Skipped invalid home during bulk like: %s", e
                )
        db.session.commit()
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
        favorites = [home.to_dict() for home in homes]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to update favorite homes: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def add_favorite_home(user: User) -> Response | tuple[Response, int]:
    """Add a single home to the user's favorites list and store full home data in home_universal."""
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
        add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=True)
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
        favorites = [h.to_dict() for h in homes]
        return jsonify(
            {"success": True, "message": "Home added to favorites", "favorites": favorites}
        )
    except Exception as e:
        current_app.logger.error("Failed to add favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def remove_favorite_home(user: User) -> Response | tuple[Response, int]:
    """Unlike a single home by setting is_liked to False without deleting the row."""
    try:
        data = request.get_json(force=True)
        address = data.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        normalized_target = safe_normalize_address(address)
        existing_home = None
        for h in HomeUniversal.query.filter_by(user_id=str(user.id)).all():
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
            return jsonify({"success": False, "error": "Home not found in favorites"}), 404
        existing_home.is_liked = False
        db.session.commit()
        sync_to_home_likes(existing_home, action="unliked")
        homes = HomeUniversal.query.filter_by(user_id=str(user.id), current=True).all()
        favorites = [h.to_dict() for h in homes]
        return jsonify({"success": True, "message": "Home unliked", "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to remove favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500
