"""SkySlope OAuth routes."""

from flask import Blueprint

from .handlers.oauth import skyslope_callback, skyslope_connect

skyslope_bp = Blueprint("skyslope", __name__, url_prefix="/api/v1/skyslope")

skyslope_bp.route("/connect", methods=["GET"])(skyslope_connect)
skyslope_bp.route("/callback", methods=["GET"])(skyslope_callback)
