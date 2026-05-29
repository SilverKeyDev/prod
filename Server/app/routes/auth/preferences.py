"""
Preferences API blueprint. Route handlers live in handlers/.
"""

from flask import Blueprint

from .handlers import (
    create_or_update_preferences,
    delete_preferences,
    generate_client_action_plan,
    get_agents,
    get_clients_preferences,
    get_preferences,
    get_user_agents,
    get_user_preferences_by_id,
    remove_agent_relationship,
    set_as_agent,
)

preferences_bp = Blueprint("preferences", __name__, url_prefix="/api/v1/preferences")

preferences_bp.route("", methods=["POST"])(create_or_update_preferences)
preferences_bp.route("", methods=["GET"])(get_preferences)
preferences_bp.route("", methods=["DELETE"])(delete_preferences)
preferences_bp.route("/user/<user_id>", methods=["GET"])(get_user_preferences_by_id)
preferences_bp.route("/clients", methods=["GET"])(get_clients_preferences)
preferences_bp.route("/agents", methods=["GET"])(get_agents)
preferences_bp.route("/add", methods=["GET"])(set_as_agent)
preferences_bp.route("/users_agents", methods=["GET"])(get_user_agents)
preferences_bp.route("/remove", methods=["GET"])(remove_agent_relationship)
preferences_bp.route("/action-plan/<client_id>", methods=["POST"])(generate_client_action_plan)
