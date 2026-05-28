"""Favorite homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.dtos.property import PropertyDTO
from app.models import PropertyCache, UserPropertyLink
from app.schemas import (
    AddFavoriteRequest,
    BulkUpdateFavoritesRequest,
    FavoriteHomesReplaceResponse,
    FavoriteHomesResponse,
    RemoveFavoriteRequest,
)
from app.services.search.db.search_db import add_or_update_home_basic, sync_to_home_likes
from app.utils.common_patterns import require_authenticated_user, resolve_agent_scoped_user_id
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address, safe_normalize_address
from app.utils.http.pagination import build_pagination, parse_query_pagination_args
from app.utils.validation import validate_request, validate_response

if TYPE_CHECKING:
    from app.models.user import User


@require_authenticated_user
@validate_response(FavoriteHomesResponse)
def get_favorite_homes(user: User) -> Response | tuple[Response, int]:
    """Paginated liked homes and parallel current listings (OpenAPI `SavedHome` via PropertyDTO)."""
    target_uid, scope_err = resolve_agent_scoped_user_id(user)
    if scope_err:
        return scope_err[0], scope_err[1]

    page, per_page = parse_query_pagination_args(
        request.args, legacy_limit_default=100, default_per_page=20
    )

    liked_query = UserPropertyLink.query.filter_by(
        user_id=str(target_uid), is_liked=True, current=True
    ).order_by(UserPropertyLink.updated_at.desc())
    all_query = UserPropertyLink.query.filter_by(user_id=str(target_uid), current=True).order_by(
        UserPropertyLink.updated_at.desc()
    )

    total_favorites = liked_query.count()
    total_listings = all_query.count()

    offset = (page - 1) * per_page
    liked_links = liked_query.limit(per_page).offset(offset).all()
    all_links = all_query.limit(per_page).offset(offset).all()

    favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]
    listings = [PropertyDTO.to_saved_home(link) for link in all_links]

    return jsonify(
        {
            "success": True,
            "favorites": favorites,
            "listings": listings,
            "pagination": {
                "favorites": build_pagination(page=page, per_page=per_page, total=total_favorites),
                "listings": build_pagination(page=page, per_page=per_page, total=total_listings),
            },
        }
    )


@require_authenticated_user
@validate_request(BulkUpdateFavoritesRequest)
@validate_response(FavoriteHomesReplaceResponse)
def post_favorite_homes(
    user: User, data: BulkUpdateFavoritesRequest | None = None
) -> Response | tuple[Response, int]:
    """Replace the user's favorites list."""
    try:
        if data is not None:
            homes_payload = data.model_dump().get("favorites") or []
        else:
            homes_payload = request.get_json(force=True)
            if not isinstance(homes_payload, list):
                return jsonify({"success": False, "error": "Expected JSON array"}), 400

        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]

        existing_links = UserPropertyLink.query.filter_by(
            user_id=str(target_uid), current=True
        ).all()
        for link in existing_links:
            was_liked = link.is_liked
            link.is_liked = False
            if was_liked:
                prop = get_model(PropertyCache, link.property_id)
                if prop:
                    sync_to_home_likes(link, prop, action="unliked")

        for home in homes_payload:
            if not isinstance(home, dict):
                current_app.logger.warning("[FAVORITES] Skipped non-object entry during bulk like")
                continue
            try:
                add_or_update_home_basic(user_id=str(target_uid), home=home, set_liked=True)
            except Exception as e:
                current_app.logger.warning(
                    "[FAVORITES] Skipped invalid home during bulk like: %s", e
                )
        db.session.commit()

        liked_links = UserPropertyLink.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to update favorite homes: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
@validate_request(AddFavoriteRequest)
@validate_response(FavoriteHomesReplaceResponse)
def add_favorite_home(
    user: User, data: AddFavoriteRequest | None = None
) -> Response | tuple[Response, int]:
    """Add a single home to the user's favorites."""
    try:
        if data is not None:
            request_data = data.model_dump(mode="json", by_alias=True)
        else:
            request_data = request.get_json(force=True)
            if not isinstance(request_data, dict):
                return jsonify({"success": False, "error": "Expected JSON object"}), 400

        target_uid, scope_err = resolve_agent_scoped_user_id(user, request_data)
        if scope_err:
            return scope_err[0], scope_err[1]
        home = request_data.get("home")
        if not home or not isinstance(home, dict):
            return jsonify({"success": False, "error": "Home object is required"}), 400
        address = home.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        add_or_update_home_basic(user_id=str(target_uid), home=home, set_liked=True)
        liked_links = UserPropertyLink.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "property_favorited",
            properties={"total_favorites": len(liked_links)},
        )

        return jsonify(
            {"success": True, "message": "Home added to favorites", "favorites": favorites}
        )
    except Exception as e:
        current_app.logger.error("Failed to add favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
@validate_request(RemoveFavoriteRequest)
@validate_response(FavoriteHomesReplaceResponse)
def remove_favorite_home(
    user: User, data: RemoveFavoriteRequest | None = None
) -> Response | tuple[Response, int]:
    """Unlike a single home by setting is_liked to False."""
    try:
        if data is not None:
            request_data = data.model_dump()
        else:
            request_data = request.get_json(force=True)
            if not isinstance(request_data, dict):
                return jsonify({"success": False, "error": "Expected JSON object"}), 400

        target_uid, scope_err = resolve_agent_scoped_user_id(user, request_data)
        if scope_err:
            return scope_err[0], scope_err[1]
        address = request_data.get("address")
        if not address or not isinstance(address, str):
            return jsonify(
                {"success": False, "error": "Address is required and must be a string"}
            ), 400
        normalized_target = safe_normalize_address(address)

        all_user_links = UserPropertyLink.query.filter_by(user_id=str(target_uid)).all()
        matching: list[UserPropertyLink] = []
        for link in all_user_links:
            prop = get_model(PropertyCache, link.property_id)
            if not prop or not prop.address:
                continue
            try:
                norm_existing = normalize_address(prop.address)
            except Exception:
                norm_existing = prop.address.strip().lower()
            if norm_existing == normalized_target:
                matching.append(link)

        if not matching:
            return jsonify({"success": False, "error": "Home not found in favorites"}), 404

        for link in matching:
            if link.is_liked:
                prop = get_model(PropertyCache, link.property_id)
                if prop:
                    sync_to_home_likes(link, prop, action="unliked")
            link.is_liked = False
        db.session.commit()

        liked_links = UserPropertyLink.query.filter_by(
            user_id=str(target_uid), is_liked=True, current=True
        ).all()
        favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "property_unfavorited",
            properties={"total_favorites": len(liked_links)},
        )

        return jsonify({"success": True, "message": "Home unliked", "favorites": favorites})
    except Exception as e:
        current_app.logger.error("Failed to remove favorite home: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500
