"""Feed API - Reels-style listing feed, likes, and comments."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app import db
from app.models import HomeComment, ReelLike, User
from app.schemas import (
    AddCommentRequest,
    AddCommentResponse,
    AddFeedLikeRequest,
    FeedLikesQueryParams,
    FeedListQueryParams,
    SuccessResponse,
)
from app.services.auth import get_current_user
from app.utils.common_patterns import require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

feed_bp = Blueprint("feed", __name__, url_prefix="/api/v1/feed")


def _comment_to_client(comment: HomeComment) -> dict:
    """Convert a HomeComment model to OpenAPI FeedCommentApiShape."""
    user = get_model(User, comment.user_id) if comment.user_id else None
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


@feed_bp.route("", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_query(FeedListQueryParams)
def get_feed(query: FeedListQueryParams | None = None):
    """
    GET /api/v1/feed?page=0&limit=10&filtersHash=...&cursor=...
    Returns paginated feed items. Client expects { items: [], hasMore: boolean, cursor?: string }.
    """
    params = query or FeedListQueryParams()
    _ = max(0, params.page or 0)
    _ = min(50, max(1, params.limit or 10))
    return jsonify(
        {
            "items": [],
            "hasMore": False,
            "cursor": None,
        }
    )


@feed_bp.route("/likes", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
@validate_query(FeedLikesQueryParams)
def get_feed_likes(query: FeedLikesQueryParams | None = None):
    """
    GET /api/v1/feed/likes?ids=id1,id2,...
    Returns { likes: { [homeId]: { count, isLikedByMe } } }. Auth optional.
    """
    ids_param = (query.ids if query is not None else request.args.get("ids", "")) or ""
    home_ids = [x.strip() for x in ids_param.split(",") if x.strip()][:100]
    if not home_ids:
        return jsonify({"likes": {}})

    try:
        from sqlalchemy import func

        # Batch count all likes with a single aggregated query
        like_counts = (
            db.session.query(ReelLike.home_id, func.count(ReelLike.id).label("count"))
            .filter(ReelLike.home_id.in_(home_ids))
            .group_by(ReelLike.home_id)
            .all()
        )

        counts = {home_id: {"count": 0, "isLikedByMe": False} for home_id in home_ids}
        for home_id, count in like_counts:
            counts[home_id]["count"] = count

        user = get_current_user()
        if user:
            user_id = str(user.id)
            liked = ReelLike.query.filter(
                ReelLike.home_id.in_(home_ids), ReelLike.user_id == user_id
            ).all()
            for rec in liked:
                counts[rec.home_id]["isLikedByMe"] = True

        return jsonify({"likes": counts})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@feed_bp.route("/likes", methods=["POST"])
@require_authenticated_user
@validate_request(AddFeedLikeRequest)
@validate_response(SuccessResponse)
def post_feed_like(user, data: AddFeedLikeRequest | None = None):
    """POST /api/v1/feed/likes body { homeId }. Like a reel by home_id."""
    if data is None:
        request_data = request.get_json(silent=True) or {}
        home_id = str(request_data.get("homeId") or request_data.get("home_id") or "").strip()
    else:
        request_data = data.model_dump()
        home_id = str(request_data.get("home_id") or "").strip()
    if not home_id:
        return jsonify({"success": False, "error": "homeId is required"}), 400

    try:
        user_id = str(user.id)
        existing = ReelLike.query.filter_by(user_id=user_id, home_id=home_id).first()
        if existing:
            return jsonify({"success": True})
        rec = ReelLike(user_id=user_id, home_id=home_id)
        db.session.add(rec)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@feed_bp.route("/likes/<home_id>", methods=["DELETE"])
@require_authenticated_user
def delete_feed_like(user, home_id):
    """DELETE /api/v1/feed/likes/<home_id>. Unlike a reel."""
    home_id = (home_id or "").strip()
    if not home_id:
        return jsonify({"success": False, "error": "home_id required"}), 400

    try:
        user_id = str(user.id)
        ReelLike.query.filter_by(user_id=user_id, home_id=home_id).delete()
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@feed_bp.route("/comments/<home_id>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def get_feed_comments(home_id):
    """GET /api/v1/feed/comments/<home_id>. Returns { comments: [] }."""
    home_id = (home_id or "").strip()
    if not home_id:
        return jsonify({"comments": []})

    try:
        comments = (
            HomeComment.query.filter_by(home_id=home_id)
            .order_by(HomeComment.created_at.asc())
            .all()
        )

        # Batch load all users for comments
        user_ids = [c.user_id for c in comments if c.user_id]
        users = User.query.filter(User.id.in_(user_ids)).all() if user_ids else []
        users_by_id = {str(u.id): u for u in users}

        # Serialize comments with batch-loaded users
        comment_dicts = []
        for c in comments:
            user = users_by_id.get(str(c.user_id)) if c.user_id else None
            comment_dicts.append(
                {
                    "id": c.id,
                    "user": {
                        "id": c.user_id,
                        "name": user.name if user else "Unknown",
                        "avatarUrl": getattr(user, "avatar_url", None)
                        or getattr(user, "avatarUrl", None),
                    },
                    "text": c.text,
                    "createdAt": c.created_at.isoformat() if c.created_at else None,
                    "likes": 0,
                }
            )

        return jsonify({"comments": comment_dicts})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@feed_bp.route("/comments", methods=["POST"])
@require_authenticated_user
@validate_request(AddCommentRequest)
@validate_response(AddCommentResponse)
def post_feed_comment(user, data: AddCommentRequest | None = None):
    """POST /api/v1/feed/comments body { homeId, text }. Add a comment."""
    if data is None:
        request_data = request.get_json(silent=True) or {}
        home_id = str(request_data.get("homeId") or request_data.get("home_id") or "").strip()
        text = str(request_data.get("text") or "").strip()
    else:
        request_data = data.model_dump()
        home_id = str(request_data.get("home_id") or "").strip()
        text = str(request_data.get("text") or "").strip()
    if not home_id:
        return jsonify({"success": False, "error": "homeId is required"}), 400
    if not text:
        return jsonify({"success": False, "error": "text is required"}), 400

    try:
        rec = HomeComment(home_id=home_id, user_id=str(user.id), text=text)
        db.session.add(rec)
        db.session.commit()
        db.session.refresh(rec)
        return (
            jsonify({"success": True, "comment": _comment_to_client(rec)}),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
