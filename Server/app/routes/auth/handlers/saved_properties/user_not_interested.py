"""Not-interested homes handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, jsonify
from sqlalchemy import select

from app import db
from app.dtos.property import NotInterestedHomeDTO
from app.models import HomeNotInterested, PropertyCache, UserPropertyLink
from app.schemas import (
    AddNotInterestedRequest,
    NotInterestedHomesResponse,
    RemoveNotInterestedRequest,
    UpdateNotInterestedRequest,
)
from app.services.auth.saved_homes import clear_not_interested_flag, update_not_interested_reason
from app.services.search.db import add_or_update_home_basic, sync_to_home_not_interested
from app.utils.common_patterns import (
    not_found,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address, safe_normalize_address
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.property.home_not_interested import HomeNotInterested as HomeNotInterestedModel
    from app.models.user import User


def _not_interested_payload(homes: list[HomeNotInterestedModel]) -> list[dict]:
    return [NotInterestedHomeDTO.to_response(h) for h in homes]


def _active_not_interested_homes(user_id: str) -> list[HomeNotInterestedModel]:
    return db.session.scalars(
        select(HomeNotInterested).where(
            HomeNotInterested.user_id == user_id,
            HomeNotInterested.is_not_interested.is_(True),
        )
    ).all()


def _all_not_interested_homes(user_id: str) -> list[HomeNotInterestedModel]:
    return db.session.scalars(
        select(HomeNotInterested).where(HomeNotInterested.user_id == user_id)
    ).all()


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
def not_interested_homes(user: User) -> Response | tuple[Response, int]:
    """Retrieve the user's list of not-interested homes."""
    homes = _active_not_interested_homes(str(user.id))
    return jsonify({"success": True, "notInterested": _not_interested_payload(homes)})


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(AddNotInterestedRequest)
def add_not_interested_home(
    user: User, data: AddNotInterestedRequest
) -> Response | tuple[Response, int]:
    """Mark a single home as not interested."""
    try:
        payload = data.model_dump(mode="json", by_alias=True)
        home = payload.get("home")
        if not home or not isinstance(home, dict):
            return validation("Home object is required", field_errors={"home": "Required"})
        address = home.get("address")
        if not address or not isinstance(address, str):
            return validation(
                "Address is required and must be a string",
                field_errors={"address": "Required"},
            )
        link = add_or_update_home_basic(user_id=str(user.id), home=home, set_liked=False)
        prop = get_model(PropertyCache, link.property_id)
        why = payload.get("why")
        if why and isinstance(why, str):
            why = why.strip() or None
        else:
            why = None
        sync_to_home_not_interested(link, prop, action="not_interested", why=why)
        homes = _active_not_interested_homes(str(user.id))
        return jsonify(
            {
                "success": True,
                "message": "Home marked as not interested",
                "notInterested": _not_interested_payload(homes),
            }
        )
    except Exception as e:
        log.error("AUTH", "not_interested_add_failed", e)
        return server_error(e, context={"function": "add_not_interested_home"})


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(RemoveNotInterestedRequest)
def remove_not_interested_home(
    user: User, data: RemoveNotInterestedRequest
) -> Response | tuple[Response, int]:
    """Undo not-interested status for a single home."""
    try:
        address = data.address
        if not address or not isinstance(address, str):
            return validation(
                "Address is required and must be a string",
                field_errors={"address": "Required"},
            )
        normalized_target = safe_normalize_address(address)
        existing_home = None
        for h in _all_not_interested_homes(str(user.id)):
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
            return not_found("Home not found in not-interested list")

        # Find the PropertyCache + UserPropertyLink for undo sync
        prop = _find_property_by_address(normalized_target)
        link = None
        if prop:
            link = db.session.scalar(
                select(UserPropertyLink).where(
                    UserPropertyLink.user_id == str(user.id),
                    UserPropertyLink.property_id == prop.id,
                )
            )

        clear_not_interested_flag(existing_home)

        if link and prop:
            sync_to_home_not_interested(link, prop, action="undo")

        homes = _active_not_interested_homes(str(user.id))
        return jsonify(
            {
                "success": True,
                "message": "Home removed from not-interested list",
                "notInterested": _not_interested_payload(homes),
            }
        )
    except Exception as e:
        log.error("AUTH", "not_interested_remove_failed", e)
        return server_error(e, context={"function": "remove_not_interested_home"})


@require_authenticated_user
@validate_response(NotInterestedHomesResponse)
@validate_request(UpdateNotInterestedRequest)
def update_not_interested_home(
    user: User, data: UpdateNotInterestedRequest
) -> Response | tuple[Response, int]:
    """Update the reason for a not-interested home."""
    try:
        address = data.address
        why = data.why.strip() if isinstance(data.why, str) else ""
        if not address or not isinstance(address, str):
            return validation(
                "Address is required and must be a string",
                field_errors={"address": "Required"},
            )
        if not why:
            return validation("Why cannot be empty", field_errors={"why": "Required"})
        normalized_target = safe_normalize_address(address)
        existing_home = None
        for h in _all_not_interested_homes(str(user.id)):
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
            return not_found("Home not found in not-interested list")
        update_not_interested_reason(existing_home, why)
        homes = _active_not_interested_homes(str(user.id))
        return jsonify(
            {
                "success": True,
                "message": "Not-interested reason updated",
                "notInterested": _not_interested_payload(homes),
            }
        )
    except Exception as e:
        log.error("AUTH", "not_interested_update_failed", e)
        return server_error(e, context={"function": "update_not_interested_home"})


def _find_property_by_address(normalized_address: str) -> PropertyCache | None:
    """Look up a PropertyCache record by normalized address."""
    return db.session.scalar(
        select(PropertyCache).where(PropertyCache.address_normalized == normalized_address)
    )
