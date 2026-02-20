"""Sync HomeUniversal records to HomeLikes and HomeNotInterested."""

from __future__ import annotations

from datetime import datetime

from app import db
from app.models import HomeLikes, HomeNotInterested, HomeUniversal
from app.utils.address_format import normalize_address


def sync_to_home_likes(home_universal: HomeUniversal, action: str = "liked") -> HomeLikes:
    """
    Sync a HomeUniversal record to HomeLikes and add a timestamp entry to like_history.

    Args:
        home_universal: The HomeUniversal record to sync
        action: Either "liked" or "unliked"

    Returns:
        The HomeLikes record (created or updated)
    """
    if action not in ("liked", "unliked"):
        raise ValueError("action must be 'liked' or 'unliked'")

    # Find existing HomeLikes record by normalized address
    existing_likes: HomeLikes | None = None
    if home_universal.address:
        try:
            norm = normalize_address(home_universal.address)
        except Exception:
            norm = home_universal.address.strip().lower()

        for rec in HomeLikes.query.filter_by(user_id=str(home_universal.user_id)).all():
            if not rec.address:
                continue
            try:
                rec_norm = normalize_address(rec.address)
            except Exception:
                rec_norm = rec.address.strip().lower()
            if rec_norm == norm:
                existing_likes = rec
                break

    # Prepare only fields that exist in HomeLikes model
    fields = {
        "user_id": str(home_universal.user_id),
        "is_liked": home_universal.is_liked,
        "address": home_universal.address,
        "zpid": home_universal.zpid,
        "mls_home_id": home_universal.mls_home_id,
        "score": home_universal.score,
        "latitude": home_universal.latitude,
        "longitude": home_universal.longitude,
    }

    timestamp_entry = {"timestamp": datetime.utcnow().isoformat(), "action": action}

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
    home_universal: HomeUniversal, action: str = "not_interested", why: str | None = None
) -> HomeNotInterested:
    """
    Sync a HomeUniversal record to HomeNotInterested and add a timestamp entry to not_interested_history.

    Args:
        home_universal: The HomeUniversal record to sync
        action: Either "not_interested" or "undo"
        why: Optional reason why not interested

    Returns:
        The HomeNotInterested record (created or updated)
    """
    if action not in ("not_interested", "undo"):
        raise ValueError("action must be 'not_interested' or 'undo'")

    existing_not_interested: HomeNotInterested | None = None
    if home_universal.address:
        try:
            norm = normalize_address(home_universal.address)
        except Exception:
            norm = home_universal.address.strip().lower()

        for rec in HomeNotInterested.query.filter_by(user_id=str(home_universal.user_id)).all():
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
        "user_id": str(home_universal.user_id),
        "is_not_interested": action == "not_interested",
        "address": home_universal.address,
        "zpid": home_universal.zpid,
        "mls_home_id": home_universal.mls_home_id,
        "score": home_universal.score,
        "latitude": home_universal.latitude,
        "longitude": home_universal.longitude,
    }

    timestamp_entry = {"timestamp": datetime.utcnow().isoformat(), "action": action}
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
