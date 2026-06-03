"""DocuSign OAuth routes: start, callback."""

from flask import jsonify, redirect, request, session

from app.schemas import DocusignOAuthStartResponse, OAuthCallbackQueryParams
from app.services.auth.user_role_helpers import user_is_agent
from app.services.docusign import DocusignOAuthService
from app.utils.common_patterns import (
    forbidden,
    invalid_request,
    require_authenticated_user,
    server_error,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_query, validate_response
from logger import log


def register_oauth_routes(bp):
    @bp.route("/oauth/start", methods=["GET"])
    @rate_limit(max_requests=10, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignOAuthStartResponse)
    def oauth_start(user):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted OAuth start",
                    {"user_id": user.id},
                )
                return forbidden()
            log.debug("DOCUSIGN", "Starting DocuSign OAuth flow", {"user_id": user.id})
            auth_url, state = DocusignOAuthService.build_auth_url(user.id)
            session["docusign_oauth_state"] = state
            log.info(
                "DOCUSIGN",
                "OAuth flow started successfully",
                {"user_id": user.id, "state": state[:8] + "..."},
            )
            return jsonify({"success": True, "auth_url": auth_url}), 200
        except Exception as e:
            log.error("ERRORS", "OAuth start failed", {"error": str(e)})
            return server_error(e, context={"function": "docusign_oauth_start", "user_id": user.id})

    @bp.route("/oauth/callback", methods=["GET"])
    @rate_limit(max_requests=10, window_seconds=60)
    @validate_query(OAuthCallbackQueryParams)
    def oauth_callback(query: OAuthCallbackQueryParams | None = None):
        try:
            code = query.code if query is not None else request.args.get("code")
            state = query.state if query is not None else request.args.get("state")
            log.debug(
                "DOCUSIGN",
                "Received OAuth callback",
                {
                    "has_code": bool(code),
                    "has_state": bool(state),
                    "state_prefix": state[:8] + "..." if state else None,
                },
            )
            if not code or not state:
                return invalid_request("Missing code or state")
            stored_state = session.get("docusign_oauth_state")
            if not stored_state or stored_state != state:
                log.warn(
                    "DOCUSIGN",
                    "OAuth state verification failed",
                    {
                        "has_stored_state": bool(stored_state),
                        "states_match": stored_state == state if stored_state and state else False,
                    },
                )
                return invalid_request("Invalid state")
            user_id = DocusignOAuthService.extract_user_id_from_state(state)
            log.debug("DOCUSIGN", "Exchanging OAuth code for tokens", {"user_id": user_id})
            DocusignOAuthService.exchange_code_for_tokens(user_id, code)
            log.info(
                "DOCUSIGN",
                "OAuth flow completed successfully",
                {"user_id": user_id},
            )
            from app.config import get_frontend_url

            return redirect(f"{get_frontend_url()}/profile/docusign?connected=true")
        except Exception as e:
            log.error("ERRORS", "OAuth callback failed", {"error": str(e)})
            from app.config import get_frontend_url

            return redirect(f"{get_frontend_url()}/profile/docusign?error=true")
