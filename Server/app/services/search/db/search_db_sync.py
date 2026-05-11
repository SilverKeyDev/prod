"""Sync UserPropertyLink+PropertyCache records to HomeLikes and HomeNotInterested."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app import db
from app.models import HomeLikes, HomeNotInterested
from app.utils.format.address_format import normalize_address

if TYPE_CHECKING:
    from app.models.property.property_cache import PropertyCache
    from app.models.property.user_property_link import UserPropertyLink


def sync_to_home_likes(
    link: UserPropertyLink, prop: PropertyCache, action: str = "liked"
) -> HomeLikes:
    """Sync a UserPropertyLink + PropertyCache pair to the HomeLikes table."""
    if action not in ("liked", "unliked"):
        raise ValueError("action must be 'liked' or 'unliked'")

    existing_likes: HomeLikes | None = None
    if prop.address:
        try:
            norm = normalize_address(prop.address)
        except Exception:
            norm = prop.address.strip().lower()

        for rec in HomeLikes.query.filter_by(user_id=str(link.user_id)).all():
            if not rec.address:
                continue
            try:
                rec_norm = normalize_address(rec.address)
            except Exception:
                rec_norm = rec.address.strip().lower()
            if rec_norm == norm:
                existing_likes = rec
                break

    fields = {
        "user_id": str(link.user_id),
        "is_liked": link.is_liked,
        "address": prop.address,
        "zpid": prop.zpid,
        "mls_home_id": prop.mls_home_id,
        "score": link.score,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
    }

    timestamp_entry = {"timestamp": datetime.now(timezone.utc).isoformat(), "action": action}

    if existing_likes:
        for k, v in fields.items():
            setattr(existing_likes, k, v)
        if existing_likes.like_history is None:
            existing_likes.like_history = []
        existing_likes.like_history.append(timestamp_entry)
        db.session.commit()
        return existing_likes

    like_history = [timestamp_entry]
    record = HomeLikes(like_history=like_history, **fields)
    db.session.add(record)
    db.session.commit()
    return record


def sync_to_home_not_interested(
    link: UserPropertyLink,
    prop: PropertyCache,
    action: str = "not_interested",
    why: str | None = None,
) -> HomeNotInterested:
    """Sync a UserPropertyLink + PropertyCache pair to the HomeNotInterested table."""
    if action not in ("not_interested", "undo"):
        raise ValueError("action must be 'not_interested' or 'undo'")

    existing_not_interested: HomeNotInterested | None = None
    if prop.address:
        try:
            norm = normalize_address(prop.address)
        except Exception:
            norm = prop.address.strip().lower()

        for rec in HomeNotInterested.query.filter_by(user_id=str(link.user_id)).all():
            if not rec.address:
                continue
            try:
                rec_norm = normalize_address(rec.address)
            except Exception:
                rec_norm = rec.address.strip().lower()
            if rec_norm == norm:
                existing_not_interested = rec
                break

    fields = {
        "user_id": str(link.user_id),
        "is_not_interested": action == "not_interested",
        "address": prop.address,
        "zpid": prop.zpid,
        "mls_home_id": prop.mls_home_id,
        "score": link.score,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
    }

    timestamp_entry = {"timestamp": datetime.now(timezone.utc).isoformat(), "action": action}
    if why and action == "not_interested":
        timestamp_entry["why"] = why

    if existing_not_interested:
        for k, v in fields.items():
            setattr(existing_not_interested, k, v)
        if why and action == "not_interested":
            existing_not_interested.why = why
        if existing_not_interested.not_interested_history is None:
            existing_not_interested.not_interested_history = []
        existing_not_interested.not_interested_history.append(timestamp_entry)
        db.session.commit()
        return existing_not_interested

    not_interested_history = [timestamp_entry]
    record_fields = fields.copy()
    if why and action == "not_interested":
        record_fields["why"] = why
    record = HomeNotInterested(not_interested_history=not_interested_history, **record_fields)
    db.session.add(record)
    db.session.commit()
    return record
