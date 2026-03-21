from flask import Blueprint

from .handlers.current_user_agent import set_current_user_agent_status
from .handlers.delete_user import delete_user_account
from .handlers.logger_config import get_logger_config, update_logger_config

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")

admin_bp.route("/logger-config", methods=["GET"])(get_logger_config)
admin_bp.route("/logger-config", methods=["POST"])(update_logger_config)
admin_bp.route("/current-user-agent-status", methods=["POST"])(set_current_user_agent_status)
admin_bp.route("/users/delete", methods=["POST"])(delete_user_account)
