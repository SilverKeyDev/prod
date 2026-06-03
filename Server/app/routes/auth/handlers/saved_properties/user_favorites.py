"""Favorite homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, jsonify, request
from sqlalchemy import func, select

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
from app.services.search.db import add_or_update_home_basic
from app.utils.common_patterns import (
    not_found,
    require_authenticated_user,
    resolve_agent_scoped_user_id,
    server_error,
    validation,
)
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address, safe_normalize_address
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

    page, per_page = parse_query_pagination_args(
        request.args, legacy_limit_default=100, default_per_page=20
    )

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
        existing_links = db.session.scalars(
            select(UserPropertyLink).where(
                UserPropertyLink.user_id == uid,
                UserPropertyLink.current.is_(True),
            )
        ).all()
        for link in existing_links:
            was_liked = link.is_liked
            link.is_liked = False
            if was_liked:
                pass

        for home in homes_payload:
            if not isinstance(home, dict):
                log.warn("AUTH", "favorites_bulk_skip_non_object", None)
                continue
            try:
                add_or_update_home_basic(user_id=uid, home=home, set_liked=True)
            except Exception as e:
                log.warn("AUTH", "favorites_bulk_skip_invalid_home", {"error": str(e)})
        db.session.commit()

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
        normalized_target = safe_normalize_address(address)

        uid = str(target_uid)
        all_user_links = db.session.scalars(
            select(UserPropertyLink).where(UserPropertyLink.user_id == uid)
        ).all()
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
            return not_found("Home not found in favorites")

        for link in matching:
            if link.is_liked:
                pass
            link.is_liked = False
        db.session.commit()

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
