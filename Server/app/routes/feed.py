"""Feed API - Reels-style listing feed, likes, and comments."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app import db
from app.models import HomeComment, ReelLike, User
from app.services.auth import get_current_user
from app.utils.common_patterns import require_authenticated_user

feed_bp = Blueprint("feed", __name__, url_prefix="/api/v1/feed")


@feed_bp.route("", methods=["GET"])
def get_feed():
    """
    GET /api/v1/feed?page=0&limit=10&filtersHash=...&cursor=...
    Returns paginated feed items. Client expects { items: [], hasMore: boolean, cursor?: string }.
    """
    page = request.args.get("page", "0")
    limit = request.args.get("limit", "10")
    try:
        max(0, int(page))
        min(50, max(1, int(limit)))
    except ValueError:
        pass
    return jsonify(
        {
            "items": [],
            "hasMore": False,
            "cursor": None,
        }
    )


@feed_bp.route("/likes", methods=["GET"])
def get_feed_likes():
    """
    GET /api/v1/feed/likes?ids=id1,id2,...
    Returns { likes: { [homeId]: { count, isLikedByMe } } }. Auth optional.
    """
    ids_param = request.args.get("ids", "")
    home_ids = [x.strip() for x in ids_param.split(",") if x.strip()] if ids_param else []
    if not home_ids:
        return jsonify({"likes": {}})

    try:
        counts = {}
        for home_id in home_ids:
            count = ReelLike.query.filter_by(home_id=home_id).count()
            counts[home_id] = {"count": count, "isLikedByMe": False}

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
def post_feed_like(user):
    """POST /api/v1/feed/likes body { homeId }. Like a reel by home_id."""
    data = request.get_json(force=True) or {}
    home_id = (data.get("homeId") or data.get("home_id") or "").strip()
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


def _comment_to_client(c):
    """Map HomeComment + user to client FeedComment shape."""
    user = User.query.get(c.user_id) if c.user_id else None
    return {
        "id": c.id,
        "user": {
            "id": c.user_id,
            "name": user.name if user else "Unknown",
            "avatarUrl": getattr(user, "avatar_url", None) or getattr(user, "avatarUrl", None),
        },
        "text": c.text,
        "createdAt": c.created_at.isoformat() if c.created_at else None,
        "likes": 0,
    }


@feed_bp.route("/comments/<home_id>", methods=["GET"])
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
        return jsonify({"comments": [_comment_to_client(c) for c in comments]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@feed_bp.route("/comments", methods=["POST"])
@require_authenticated_user
def post_feed_comment(user):
    """POST /api/v1/feed/comments body { homeId, text }. Add a comment."""
    data = request.get_json(force=True) or {}
    home_id = (data.get("homeId") or data.get("home_id") or "").strip()
    text = (data.get("text") or "").strip()
    if not home_id:
        return jsonify({"success": False, "error": "homeId is required"}), 400
    if not text:
        return jsonify({"success": False, "error": "text is required"}), 400

    try:
        rec = HomeComment(home_id=home_id, user_id=str(user.id), text=text)
        db.session.add(rec)
        db.session.commit()
        db.session.refresh(rec)
        return jsonify(_comment_to_client(rec)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
