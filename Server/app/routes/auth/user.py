"""
User API blueprint. Route handlers live in handlers/.
"""

from flask import Blueprint

from .handlers import (
    add_favorite_home,
    add_not_interested_home,
    get_close_checklist,
    get_favorite_homes,
    get_timeline_checklist,
    get_user_profile,
    not_interested_homes,
    post_favorite_homes,
    put_close_checklist,
    put_timeline_checklist,
    remove_favorite_home,
    remove_not_interested_home,
    update_closing_mode,
    update_not_interested_home,
    upload_profile_picture,
)

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/user")

user_bp.route("/profile", methods=["GET"])(get_user_profile)
user_bp.route("/profile-picture", methods=["POST"])(upload_profile_picture)
user_bp.route("/closing-mode", methods=["PUT"])(update_closing_mode)
user_bp.route("/timeline", methods=["GET"])(get_timeline_checklist)
user_bp.route("/timeline", methods=["PUT"])(put_timeline_checklist)
user_bp.route("/close", methods=["GET"])(get_close_checklist)
user_bp.route("/close", methods=["PUT"])(put_close_checklist)
user_bp.route("/favorite-homes", methods=["GET"])(get_favorite_homes)
user_bp.route("/favorite-homes", methods=["POST"])(post_favorite_homes)
user_bp.route("/favorite-homes/add", methods=["POST"])(add_favorite_home)
user_bp.route("/favorite-homes/remove", methods=["POST"])(remove_favorite_home)
user_bp.route("/not-interested-homes", methods=["GET"])(not_interested_homes)
user_bp.route("/not-interested-homes/add", methods=["POST"])(add_not_interested_home)
user_bp.route("/not-interested-homes/remove", methods=["POST"])(remove_not_interested_home)
user_bp.route("/not-interested-homes/update", methods=["POST"])(update_not_interested_home)
