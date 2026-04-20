"""Viewings API blueprint (multi-stop routes)."""

from flask import Blueprint

from .handlers import post_build_route, post_navigate_link

viewings_bp = Blueprint("viewings", __name__, url_prefix="/api/v1/viewings")

viewings_bp.route("/route", methods=["POST"])(post_build_route)
viewings_bp.route("/navigate", methods=["POST"])(post_navigate_link)
