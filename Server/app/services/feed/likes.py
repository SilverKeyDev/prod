"""Feed reel like persistence and aggregation."""

from __future__ import annotations

from sqlalchemy import delete, func, select

from app import db
from app.models import ReelLike


def get_like_counts(home_ids: list[str], user_id: str | None) -> dict[str, dict[str, int | bool]]:
    """Return { home_id: { count, isLikedByMe } } for the given home ids."""
    if not home_ids:
        return {}

    like_counts = db.session.execute(
        select(ReelLike.home_id, func.count(ReelLike.id).label("count"))
        .where(ReelLike.home_id.in_(home_ids))
        .group_by(ReelLike.home_id)
    ).all()

    counts: dict[str, dict[str, int | bool]] = {
        home_id: {"count": 0, "isLikedByMe": False} for home_id in home_ids
    }
    for home_id, count in like_counts:
        counts[home_id]["count"] = count

    if user_id:
        liked = db.session.scalars(
            select(ReelLike).where(ReelLike.home_id.in_(home_ids), ReelLike.user_id == user_id)
        ).all()
        for rec in liked:
            counts[rec.home_id]["isLikedByMe"] = True

    return counts


def add_like(user_id: str, home_id: str) -> bool:
    """Like a reel. Returns True when a new like was created, False if already liked."""
    existing = db.session.scalar(
        select(ReelLike).where(ReelLike.user_id == user_id, ReelLike.home_id == home_id)
    )
    if existing:
        return False
    db.session.add(ReelLike(user_id=user_id, home_id=home_id))
    db.session.commit()
    return True


def remove_like(user_id: str, home_id: str) -> None:
    """Remove the user's like for a home."""
    db.session.execute(
        delete(ReelLike).where(ReelLike.user_id == user_id, ReelLike.home_id == home_id)
    )
    db.session.commit()
