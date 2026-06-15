"""Feed API - Reels-style listing feed, likes, and comments."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app import db
from app.schemas import (
    AddCommentRequest,
    AddCommentResponse,
    AddFeedLikeRequest,
    FeedLikesQueryParams,
    FeedListQueryParams,
    SuccessResponse,
)
from app.services.auth import get_current_user
from app.services.feed import (
    add_comment,
    add_like,
    comment_to_client,
    get_like_counts,
    list_comments_for_home,
    remove_like,
)
from app.utils.common_patterns import (
    invalid_request,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_request, validate_response

feed_bp = Blueprint("feed", __name__, url_prefix="/api/v1/feed")


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
        user = get_current_user()
        user_id = str(user.id) if user else None
        return jsonify({"likes": get_like_counts(home_ids, user_id)})
    except Exception as e:
        return server_error(e, context={"function": "get_feed_likes"})


@feed_bp.route("/likes", methods=["POST"])
@require_authenticated_user
@validate_request(AddFeedLikeRequest)
@validate_response(SuccessResponse)
def post_feed_like(user, data: AddFeedLikeRequest):
    """POST /api/v1/feed/likes body { homeId }. Like a reel by home_id."""
    request_data = data.model_dump()
    home_id = str(request_data.get("home_id") or "").strip()
    if not home_id:
        return validation("homeId is required", field_errors={"homeId": "Required"})

    try:
        add_like(str(user.id), home_id)
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return server_error(e, context={"function": "post_feed_like", "user_id": str(user.id)})


@feed_bp.route("/likes/<home_id>", methods=["DELETE"])
@require_authenticated_user
def delete_feed_like(user, home_id):
    """DELETE /api/v1/feed/likes/<home_id>. Unlike a reel."""
    home_id = (home_id or "").strip()
    if not home_id:
        return invalid_request("home_id required")

    try:
        remove_like(str(user.id), home_id)
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return server_error(e, context={"function": "delete_feed_like", "user_id": str(user.id)})


@feed_bp.route("/comments/<home_id>", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def get_feed_comments(home_id):
    """GET /api/v1/feed/comments/<home_id>. Returns { comments: [] }."""
    home_id = (home_id or "").strip()
    if not home_id:
        return jsonify({"comments": []})

    try:
        return jsonify({"comments": list_comments_for_home(home_id)})
    except Exception as e:
        return server_error(e, context={"function": "get_feed_comments", "home_id": home_id})


@feed_bp.route("/comments", methods=["POST"])
@require_authenticated_user
@validate_request(AddCommentRequest)
@validate_response(AddCommentResponse)
def post_feed_comment(user, data: AddCommentRequest):
    """POST /api/v1/feed/comments body { homeId, text }. Add a comment."""
    request_data = data.model_dump()
    home_id = str(request_data.get("home_id") or "").strip()
    text = str(request_data.get("text") or "").strip()
    if not home_id:
        return validation("homeId is required", field_errors={"homeId": "Required"})
    if not text:
        return validation("text is required", field_errors={"text": "Required"})

    try:
        rec = add_comment(str(user.id), home_id, text)
        return (
            jsonify({"success": True, "comment": comment_to_client(rec)}),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return server_error(e, context={"function": "post_feed_comment", "user_id": str(user.id)})
