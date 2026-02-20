"""Feed API - Reels-style listing feed. Returns empty list until feed backend is implemented."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

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
