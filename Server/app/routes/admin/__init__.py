from flask import Blueprint

from .handlers.current_user_agent import set_current_user_agent_status
from .handlers.delete_user import delete_user_account
from .handlers.logger_config import get_logger_config, update_logger_config
from .handlers.reset_dev_user_data import reset_dev_user_data_route
from .handlers.update_user_system_roles import update_user_system_roles
from .handlers.validation_stats import get_validation_stats

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")

admin_bp.route("/logger-config", methods=["GET"])(get_logger_config)
admin_bp.route("/logger-config", methods=["POST"])(update_logger_config)
admin_bp.route("/current-user-agent-status", methods=["POST"])(set_current_user_agent_status)
admin_bp.route("/users/delete", methods=["POST"])(delete_user_account)
admin_bp.route("/users/reset-dev-data", methods=["POST"])(reset_dev_user_data_route)
admin_bp.route("/users/roles", methods=["POST"])(update_user_system_roles)
admin_bp.route("/validation-stats", methods=["GET"])(get_validation_stats)
