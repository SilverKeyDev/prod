"""Search display settings API (map overlay, card count, sort order)."""

from flask import Blueprint

from .handlers import get_search_display, patch_search_display

search_display_bp = Blueprint("search_display", __name__, url_prefix="/api/v1/search-display")

search_display_bp.route("", methods=["GET"])(get_search_display)
search_display_bp.route("", methods=["PATCH"])(patch_search_display)
