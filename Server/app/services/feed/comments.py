"""Feed home comment persistence and serialization."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import HomeComment, User
from app.utils.db.orm_lookup import get_model


def comment_to_client(comment: HomeComment, user: User | None = None) -> dict:
    """Convert a HomeComment model to OpenAPI FeedCommentApiShape."""
    if user is None and comment.user_id:
        user = get_model(User, comment.user_id)
    raw_avatar = getattr(user, "avatar_url", None) or getattr(user, "avatarUrl", None)
    avatar_url = None
    if isinstance(raw_avatar, str) and (
        raw_avatar.startswith("http://") or raw_avatar.startswith("https://")
    ):
        avatar_url = raw_avatar
    uid = str(comment.user_id) if comment.user_id else ""
    return {
        "id": str(comment.id),
        "user": {
            "id": uid,
            "name": user.name if user else "Unknown",
            "avatarUrl": avatar_url,
        },
        "text": comment.text,
        "createdAt": comment.created_at.isoformat() if comment.created_at else None,
        "likes": 0,
    }


def list_comments_for_home(home_id: str) -> list[dict]:
    """List comments for a home, with users batch-loaded."""
    comments = db.session.scalars(
        select(HomeComment)
        .where(HomeComment.home_id == home_id)
        .order_by(HomeComment.created_at.asc())
    ).all()

    user_ids = [c.user_id for c in comments if c.user_id]
    users = db.session.scalars(select(User).where(User.id.in_(user_ids))).all() if user_ids else []
    users_by_id = {str(u.id): u for u in users}

    return [
        comment_to_client(c, users_by_id.get(str(c.user_id)) if c.user_id else None)
        for c in comments
    ]


def add_comment(user_id: str, home_id: str, text: str) -> HomeComment:
    """Persist a new comment and return the refreshed row."""
    rec = HomeComment(home_id=home_id, user_id=user_id, text=text)
    db.session.add(rec)
    db.session.commit()
    db.session.refresh(rec)
    return rec
