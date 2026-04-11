"""DocuSign OAuth routes: start, callback."""

from flask import jsonify, redirect, request, session

from app.services.auth import get_current_user
from app.services.docusign import DocusignOAuthService
from app.services.docusign.utils.permissions import is_agent
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from logger import LOG_CATEGORIES, get_logger

log = get_logger()


def register_oauth_routes(bp):
    @bp.route("/oauth/start", methods=["GET"])
    @rate_limit(max_requests=10, window_seconds=60)
    def oauth_start():
        try:
            user = get_current_user()
            if not user or not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted OAuth start",
                    {"user_id": user.id if user else None},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"], "Starting DocuSign OAuth flow", {"user_id": user.id}
            )
            auth_url, state = DocusignOAuthService.build_auth_url(user.id)
            session["docusign_oauth_state"] = state
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "OAuth flow started successfully",
                {"user_id": user.id, "state": state[:8] + "..."},
            )
            return jsonify({"success": True, "auth_url": auth_url}), 200
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "OAuth start failed", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "OAuth start failed")

    @bp.route("/oauth/callback", methods=["GET"])
    @rate_limit(max_requests=10, window_seconds=60)
    def oauth_callback():
        try:
            code = request.args.get("code")
            state = request.args.get("state")
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Received OAuth callback",
                {
                    "has_code": bool(code),
                    "has_state": bool(state),
                    "state_prefix": state[:8] + "..." if state else None,
                },
            )
            if not code or not state:
                return jsonify({"error": "Missing code or state"}), 400
            stored_state = session.get("docusign_oauth_state")
            if not stored_state or stored_state != state:
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "OAuth state verification failed",
                    {
                        "has_stored_state": bool(stored_state),
                        "states_match": stored_state == state if stored_state and state else False,
                    },
                )
                return jsonify({"error": "Invalid state"}), 400
            user_id = DocusignOAuthService.extract_user_id_from_state(state)
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"], "Exchanging OAuth code for tokens", {"user_id": user_id}
            )
            DocusignOAuthService.exchange_code_for_tokens(user_id, code)
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "OAuth flow completed successfully",
                {"user_id": user_id},
            )
            from app.config import get_frontend_url

            return redirect(f"{get_frontend_url()}/profile/docusign?connected=true")
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "OAuth callback failed", {"error": str(e)})
            from app.config import get_frontend_url

            return redirect(f"{get_frontend_url()}/profile/docusign?error=true")
