"""DocuSign template routes: list, sync."""

from flask import jsonify

from app.models import DocusignTemplate
from app.services.auth import get_current_user
from app.services.docusign.utils.permissions import is_agent
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_template_routes(bp):
    @bp.route("/templates", methods=["GET"])
    @rate_limit(max_requests=50, window_seconds=60)
    def list_templates():
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to list templates",
                    {"user_id": user.id if user else None},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"], "Listing DocuSign templates", {"user_id": user.id}
            )
            templates = DocusignTemplate.query.filter_by(is_active=True).all()
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Templates listed successfully",
                {"user_id": user.id, "count": len(templates)},
            )
            return jsonify({"success": True, "templates": [t.to_dict() for t in templates]}), 200
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to list templates", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to list templates")

    @bp.route("/templates/sync", methods=["POST"])
    @rate_limit(max_requests=5, window_seconds=60)
    def sync_templates():
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to sync templates",
                    {"user_id": user.id if user else None},
                )
                return jsonify({"error": "Agent access required"}), 403
            log.debug(LOG_CATEGORIES["DOCUSIGN"], "Starting template sync", {"user_id": user.id})
            from app.celery.tasks.docusign import sync_templates_task

            task = sync_templates_task.delay()  # pyright: ignore[reportFunctionMemberAccess]
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Template sync task enqueued",
                {"user_id": user.id, "task_id": task.id},
            )
            return jsonify(
                {"success": True, "task_id": task.id, "message": "Template sync started"}
            ), 202
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to sync templates", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to sync templates")
