"""
Auth API blueprint. Route handlers live in handlers/.
"""

from flask import Blueprint

from .handlers import (
    forgot_password,
    google_oauth_callback,
    google_oauth_start,
    login,
    logout,
    refresh_token,
    resend_code,
    reset_password,
    signup,
    verify,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

auth_bp.route("/signup", methods=["POST"])(signup)
auth_bp.route("/verify", methods=["POST"])(verify)
auth_bp.route("/resend-code", methods=["POST"])(resend_code)
auth_bp.route("/login", methods=["POST"])(login)
auth_bp.route("/forgot-password", methods=["POST"])(forgot_password)
auth_bp.route("/reset-password", methods=["POST"])(reset_password)
auth_bp.route("/refresh-token", methods=["POST"])(refresh_token)
auth_bp.route("/logout", methods=["POST"])(logout)
auth_bp.route("/google/start", methods=["GET"])(google_oauth_start)
auth_bp.route("/google/callback", methods=["GET"])(google_oauth_callback)
