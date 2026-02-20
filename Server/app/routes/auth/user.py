"""
User API blueprint. Route handlers live in user_handlers/.
"""

from flask import Blueprint

from .user_handlers import (
    add_favorite_home,
    add_not_interested_home,
    close_checklist,
    favorite_homes,
    get_user_profile,
    not_interested_homes,
    remove_favorite_home,
    remove_not_interested_home,
    timeline_checklist,
    update_closing_mode,
    update_not_interested_home,
    upload_profile_picture,
)

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/user")

user_bp.route("/profile", methods=["GET"])(get_user_profile)
user_bp.route("/profile-picture", methods=["POST"])(upload_profile_picture)
user_bp.route("/closing-mode", methods=["PUT"])(update_closing_mode)
user_bp.route("/timeline", methods=["GET", "PUT"])(timeline_checklist)
user_bp.route("/close", methods=["GET", "PUT"])(close_checklist)
user_bp.route("/favorite-homes", methods=["GET", "POST"])(favorite_homes)
user_bp.route("/favorite-homes/add", methods=["POST"])(add_favorite_home)
user_bp.route("/favorite-homes/remove", methods=["POST"])(remove_favorite_home)
user_bp.route("/not-interested-homes", methods=["GET"])(not_interested_homes)
user_bp.route("/not-interested-homes/add", methods=["POST"])(add_not_interested_home)
user_bp.route("/not-interested-homes/remove", methods=["POST"])(remove_not_interested_home)
user_bp.route("/not-interested-homes/update", methods=["POST"])(update_not_interested_home)
