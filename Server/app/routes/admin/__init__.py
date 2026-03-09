from flask import Blueprint

from .handlers.logger_config import get_logger_config, update_logger_config

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")

admin_bp.route("/logger-config", methods=["GET"])(get_logger_config)
admin_bp.route("/logger-config", methods=["POST"])(update_logger_config)
