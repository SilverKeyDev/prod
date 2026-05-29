"""
User API blueprint. Route handlers live in handlers/.
"""

from flask import Blueprint

from .handlers import (
    add_favorite_home,
    add_not_interested_home,
    get_favorite_homes,
    get_user_profile,
    not_interested_homes,
    post_favorite_homes,
    remove_favorite_home,
    remove_not_interested_home,
    update_not_interested_home,
    upload_profile_picture,
)
from .handlers.client_settings import get_client_settings, patch_client_settings
from .handlers.user_privacy import delete_my_account, export_user_data

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/user")

user_bp.route("/profile", methods=["GET"])(get_user_profile)
user_bp.route("/account/delete", methods=["POST"])(delete_my_account)
user_bp.route("/data-export", methods=["GET"])(export_user_data)
user_bp.route("/client-settings", methods=["GET"])(get_client_settings)
user_bp.route("/client-settings", methods=["PATCH"])(patch_client_settings)
user_bp.route("/profile-picture", methods=["POST"])(upload_profile_picture)
user_bp.route("/favorite-homes", methods=["GET"])(get_favorite_homes)
user_bp.route("/favorite-homes", methods=["POST"])(post_favorite_homes)
user_bp.route("/favorite-homes/add", methods=["POST"])(add_favorite_home)
user_bp.route("/favorite-homes/remove", methods=["POST"])(remove_favorite_home)
user_bp.route("/not-interested-homes", methods=["GET"])(not_interested_homes)
user_bp.route("/not-interested-homes/add", methods=["POST"])(add_not_interested_home)
user_bp.route("/not-interested-homes/remove", methods=["POST"])(remove_not_interested_home)
user_bp.route("/not-interested-homes/update", methods=["POST"])(update_not_interested_home)
