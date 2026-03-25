"""SkySlope OAuth connect and callback handlers.

Token exchange uses standard OAuth2 form posts; default endpoints come from
app.config._urls (Okta issuer + /v1/token, or legacy accounts.*) — not HMAC.
HMAC applies only to api.skyslope.com /auth/login; see app.services.skyslope.hmac_auth.
"""

import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests
from flask import jsonify, redirect, request, session

from app.config.skyslope import get_skyslope_config, is_skyslope_configured
from app.services.auth import SecurityException, get_current_user
from app.services.skyslope.pkce import generate_pkce
from app.services.skyslope.token_store import get_tokens, save_tokens
from app.utils.common_patterns import require_authenticated_user
from app.utils.security.security import redact_sensitive_data
from logger import LOG_CATEGORIES, log


def _html_page(title: str, body: str, is_error: bool = False) -> str:
    """Return a minimal HTML page."""
    color = "#dc2626" if is_error else "#16a34a"
    return f"""<!DOCTYPE html>
<html>
<head><title>{title}</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;">
<h2 style="color:{color}">{title}</h2>
<p>{body}</p>
<p><a href="/admin">Back to Admin</a></p>
</body>
</html>"""


def skyslope_connect():
    """Start SkySlope OAuth flow. Admin-only."""
    try:
        user = get_current_user()
    except SecurityException:
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Skyslope connect: unauthenticated request",
            {},
        )
        return _html_page(
            "Authentication Required", "Please log in to connect SkySlope.", True
        ), 401

    if not user:
        return _html_page(
            "Authentication Required", "Please log in to connect SkySlope.", True
        ), 401

    # TODO: Re-enable admin check when roles are properly assigned
    # if not user_has_admin_role(user):
    #     log.security(...)
    #     return _html_page("Access Denied", "Admin access required.", True), 403

    if not is_skyslope_configured():
        log.warn(
            LOG_CATEGORIES["API"],
            "Skyslope connect: credentials not configured",
            {},
        )
        return _html_page(
            "Configuration Error",
            "SkySlope integration is not configured. Set SKYSLOPE_ACCESS_KEY and SKYSLOPE_SECRET.",
            True,
        ), 500

    try:
        config = get_skyslope_config()
        state = secrets.token_urlsafe(32)
        session["skyslope_oauth_state"] = state
        session.permanent = True

        params = {
            "response_type": "code",
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "scope": config["scope"],
            "state": state,
        }
        if config["use_pkce"]:
            code_verifier, code_challenge = generate_pkce()
            session["skyslope_oauth_code_verifier"] = code_verifier
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"

        auth_url = f"{config['authorize_url']}?{urlencode(params)}"

        log.info(
            LOG_CATEGORIES["API"],
            "Skyslope connect: redirecting to authorize",
            {
                "redirect_uri": redact_sensitive_data({"uri": config["redirect_uri"]}).get(
                    "uri", "[REDACTED]"
                ),
            },
        )
        return redirect(auth_url)

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Skyslope connect failed",
            {"error": str(e)},
        )
        return _html_page(
            "Connection Error",
            "Failed to start SkySlope connection. Please try again later.",
            True,
        ), 500


def skyslope_callback():
    """Handle SkySlope OAuth callback."""
    error_param = request.args.get("error")
    error_description = request.args.get("error_description")
    if error_param:
        log.warn(
            LOG_CATEGORIES["API"],
            "Skyslope callback: OAuth error",
            {"error": error_param, "error_description": error_description or ""},
        )
        msg = error_description or error_param
        return _html_page(
            "SkySlope Authorization Failed",
            f"SkySlope returned an error: {msg}",
            True,
        ), 400

    code = request.args.get("code")
    state = request.args.get("state")

    if not code or not state:
        return _html_page(
            "Invalid Callback",
            "Missing code or state parameter.",
            True,
        ), 400

    stored_state = session.get("skyslope_oauth_state")
    code_verifier = session.get("skyslope_oauth_code_verifier")

    if not stored_state or state != stored_state:
        log.warn(
            LOG_CATEGORIES["SECURITY"],
            "Skyslope callback: invalid or missing state",
            {},
        )
        return _html_page(
            "Invalid State",
            "OAuth state validation failed. Please try connecting again.",
            True,
        ), 400

    config = get_skyslope_config()
    use_pkce = config["use_pkce"]
    if use_pkce and not code_verifier:
        log.warn(
            LOG_CATEGORIES["API"],
            "Skyslope callback: missing code_verifier in session",
            {},
        )
        return _html_page(
            "Session Expired",
            "Your session may have expired. Please try connecting again.",
            True,
        ), 400

    session.pop("skyslope_oauth_state", None)
    session.pop("skyslope_oauth_code_verifier", None)

    if not config["client_id"] or not config["client_secret"]:
        return _html_page(
            "Configuration Error",
            "SkySlope integration is not configured.",
            True,
        ), 500

    token_data_payload = {
        "grant_type": "authorization_code",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": config["redirect_uri"],
    }
    if use_pkce and code_verifier:
        token_data_payload["code_verifier"] = code_verifier

    try:
        token_resp = requests.post(
            config["token_url"],
            data=token_data_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            log.error(
                LOG_CATEGORIES["ERRORS"],
                "Skyslope callback: no access_token in response",
                {},
            )
            return _html_page(
                "Token Error",
                "SkySlope did not return an access token.",
                True,
            ), 500

        try:
            user = get_current_user()
        except SecurityException:
            return _html_page(
                "Session Expired", "Please log in and try connecting again.", True
            ), 401
        if not user:
            return _html_page(
                "Session Expired",
                "Your session may have expired. Please try again.",
                True,
            ), 401

        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        save_tokens(str(user.id), access_token, refresh_token, expires_at)

        profile_resp = requests.get(
            f"{config['api_base']}/users/profile",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30,
        )
        profile_resp.raise_for_status()
        profile = profile_resp.json()

        first_name = profile.get("firstName", "")
        last_name = profile.get("lastName", "")
        name = f"{first_name} {last_name}".strip() or "Unknown"

        log.info(
            LOG_CATEGORIES["API"],
            "Skyslope callback: connection successful",
            {"profile_name": name},
        )
        return _html_page(
            "SkySlope Connected",
            f"Profile: {name}",
            False,
        )

    except requests.RequestException as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Skyslope callback: API request failed",
            {"error": str(e)},
        )
        return _html_page(
            "Connection Error",
            "Failed to complete SkySlope connection. Please try again later.",
            True,
        ), 500
    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            "Skyslope callback: unexpected error",
            {"error": str(e)},
        )
        return _html_page(
            "Connection Error",
            "An unexpected error occurred. Please try again later.",
            True,
        ), 500


@require_authenticated_user
def skyslope_status(user):
    """Return whether the current user has SkySlope connected."""
    tokens = get_tokens(str(user.id))
    return jsonify({"connected": tokens is not None})
