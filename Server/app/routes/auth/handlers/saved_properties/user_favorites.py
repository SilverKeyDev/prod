"""Favorite homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, jsonify, request
from sqlalchemy import func, select

from app import db
from app.dtos.property import PropertyDTO
from app.models import UserPropertyLink
from app.schemas import (
    AddFavoriteRequest,
    BulkUpdateFavoritesRequest,
    FavoriteHomesReplaceResponse,
    FavoriteHomesResponse,
    RemoveFavoriteRequest,
)
from app.services.auth.saved_homes import bulk_replace_favorites, unlike_homes_by_normalized_address
from app.services.search.db import add_or_update_home_basic
from app.utils.common_patterns import (
    not_found,
    require_authenticated_user,
    resolve_agent_scoped_user_id,
    server_error,
    validation,
)
from app.utils.http.pagination import build_pagination, parse_query_pagination_args
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.user import User


def _liked_links_for_user(user_id: str) -> list[UserPropertyLink]:
    return db.session.scalars(
        select(UserPropertyLink).where(
            UserPropertyLink.user_id == user_id,
            UserPropertyLink.is_liked.is_(True),
            UserPropertyLink.current.is_(True),
        )
    ).all()


@require_authenticated_user
@validate_response(FavoriteHomesResponse)
def get_favorite_homes(user: User) -> Response | tuple[Response, int]:
    """Paginated liked homes and parallel current listings (OpenAPI `SavedHome` via PropertyDTO)."""
    target_uid, scope_err = resolve_agent_scoped_user_id(user)
    if scope_err:
        return scope_err[0], scope_err[1]

    page, per_page = parse_query_pagination_args(request.args, default_per_page=20)

    uid = str(target_uid)
    liked_where = (
        UserPropertyLink.user_id == uid,
        UserPropertyLink.is_liked.is_(True),
        UserPropertyLink.current.is_(True),
    )
    all_where = (UserPropertyLink.user_id == uid, UserPropertyLink.current.is_(True))

    total_favorites = db.session.scalar(
        select(func.count()).select_from(UserPropertyLink).where(*liked_where)
    )
    total_listings = db.session.scalar(
        select(func.count()).select_from(UserPropertyLink).where(*all_where)
    )

    offset = (page - 1) * per_page
    liked_links = db.session.scalars(
        select(UserPropertyLink)
        .where(*liked_where)
        .order_by(UserPropertyLink.updated_at.desc())
        .limit(per_page)
        .offset(offset)
    ).all()
    all_links = db.session.scalars(
        select(UserPropertyLink)
        .where(*all_where)
        .order_by(UserPropertyLink.updated_at.desc())
        .limit(per_page)
        .offset(offset)
    ).all()

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
    user: User, data: BulkUpdateFavoritesRequest
) -> Response | tuple[Response, int]:
    """Replace the user's favorites list."""
    try:
        homes_payload = data.model_dump().get("favorites") or []

        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]

        uid = str(target_uid)
        bulk_replace_favorites(uid, homes_payload)

        liked_links = _liked_links_for_user(uid)
        favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]
        return jsonify({"success": True, "favorites": favorites})
    except Exception as e:
        log.error("AUTH", "favorites_bulk_update_failed", e)
        return server_error(e, context={"function": "post_favorite_homes"})


@require_authenticated_user
@validate_request(AddFavoriteRequest)
@validate_response(FavoriteHomesReplaceResponse)
def add_favorite_home(user: User, data: AddFavoriteRequest) -> Response | tuple[Response, int]:
    """Add a single home to the user's favorites."""
    try:
        request_data = data.model_dump(mode="json", by_alias=True)

        target_uid, scope_err = resolve_agent_scoped_user_id(user, request_data)
        if scope_err:
            return scope_err[0], scope_err[1]
        home = request_data.get("home")
        if not home or not isinstance(home, dict):
            return validation("Home object is required", field_errors={"home": "Required"})
        address = home.get("address")
        if not address or not isinstance(address, str):
            return validation(
                "Address is required and must be a string",
                field_errors={"address": "Required"},
            )
        uid = str(target_uid)
        add_or_update_home_basic(user_id=uid, home=home, set_liked=True)
        liked_links = _liked_links_for_user(uid)
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
        log.error("AUTH", "favorites_add_failed", e)
        return server_error(e, context={"function": "add_favorite_home"})


@require_authenticated_user
@validate_request(RemoveFavoriteRequest)
@validate_response(FavoriteHomesReplaceResponse)
def remove_favorite_home(
    user: User, data: RemoveFavoriteRequest
) -> Response | tuple[Response, int]:
    """Unlike a single home by setting is_liked to False."""
    try:
        request_data = data.model_dump()

        target_uid, scope_err = resolve_agent_scoped_user_id(user, request_data)
        if scope_err:
            return scope_err[0], scope_err[1]
        address = request_data.get("address")
        if not address or not isinstance(address, str):
            return validation(
                "Address is required and must be a string",
                field_errors={"address": "Required"},
            )
        uid = str(target_uid)
        if not unlike_homes_by_normalized_address(uid, address):
            return not_found("Home not found in favorites")

        liked_links = _liked_links_for_user(uid)
        favorites = [PropertyDTO.to_saved_home(link) for link in liked_links]

        from app.services.analytics.posthog_events import capture_product_event

        capture_product_event(
            str(user.id),
            "property_unfavorited",
            properties={"total_favorites": len(liked_links)},
        )

        return jsonify({"success": True, "message": "Home unliked", "favorites": favorites})
    except Exception as e:
        log.error("AUTH", "favorites_remove_failed", e)
        return server_error(e, context={"function": "remove_favorite_home"})
