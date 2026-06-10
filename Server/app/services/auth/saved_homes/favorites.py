"""Favorite homes write paths."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import PropertyCache, UserPropertyLink
from app.services.search.db import add_or_update_home_basic
from app.utils.db import db_transaction
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address, safe_normalize_address
from logger import log


def clear_liked_on_current_links(user_id: str) -> None:
    """Set is_liked=False on all current property links for the user."""
    uid = str(user_id)
    existing_links = db.session.scalars(
        select(UserPropertyLink).where(
            UserPropertyLink.user_id == uid,
            UserPropertyLink.current.is_(True),
        )
    ).all()
    for link in existing_links:
        link.is_liked = False


def bulk_replace_favorites(user_id: str, homes_payload: list[Any]) -> None:
    """Replace favorites: clear liked flags, then upsert each home as liked."""
    uid = str(user_id)
    clear_liked_on_current_links(uid)
    for home in homes_payload:
        if not isinstance(home, dict):
            log.warn("AUTH", "favorites_bulk_skip_non_object", None)
            continue
        try:
            add_or_update_home_basic(user_id=uid, home=home, set_liked=True)
        except Exception as e:
            log.warn("AUTH", "favorites_bulk_skip_invalid_home", {"error": str(e)})
    with db_transaction():
        pass


def unlike_homes_by_normalized_address(user_id: str, address: str) -> bool:
    """Unlike links matching normalized address. Returns True if any link was updated."""
    uid = str(user_id)
    normalized_target = safe_normalize_address(address)
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
        return False

    with db_transaction():
        for link in matching:
            link.is_liked = False
    return True
