import os

from .constants._constants_public_urls import (
    API_PATH_DOCUSIGN_CONNECT_WEBHOOK,
    API_PATH_DOCUSIGN_OAUTH_CALLBACK,
    API_PATH_GOOGLE_CALENDAR_OAUTH_CALLBACK,
    public_frontend_origin_for_flask_env,
    url_for_public_api,
)


def get_google_redirect_uri():
    """Get Google Calendar OAuth redirect URI (must match Google Cloud Console)."""
    explicit = os.getenv("GOOGLE_REDIRECT_URI", "").strip()
    if explicit:
        return explicit
    flask_env = os.getenv("FLASK_ENV", "development")

    # Development: Flask backend — OAuth callback is an API route, not the Vite dev server
    return url_for_public_api(flask_env, API_PATH_GOOGLE_CALENDAR_OAUTH_CALLBACK)


def get_frontend_url():
    """
    Base origin for the SPA (OAuth redirects, DocuSign return_url, etc.).

    Set ``FRONTEND_URL`` or ``FRONTEND_BASE_URL`` (either name; ``FRONTEND_URL`` wins
    if both are set) when the app is not served from the default dev origin, e.g.
    ``https://….ngrok-free.app`` for embedded DocuSign in Chrome (PNA blocks redirects
    to ``http://localhost`` from the DocuSign iframe).
    """
    explicit = os.getenv("FRONTEND_URL", "").strip() or os.getenv("FRONTEND_BASE_URL", "").strip()
    if explicit:
        return explicit.rstrip("/")
    flask_env = os.getenv("FLASK_ENV", "development")
    return public_frontend_origin_for_flask_env(flask_env)


def get_docusign_webhook_connect_url() -> str:
    """Public URL DocuSign Connect should POST to (Flask API host)."""
    flask_env = os.getenv("FLASK_ENV", "development")
    return url_for_public_api(flask_env, API_PATH_DOCUSIGN_CONNECT_WEBHOOK)


def get_docusign_oauth_redirect_uri() -> str:
    """OAuth redirect for agent DocuSign connect (Flask API route)."""
    flask_env = os.getenv("FLASK_ENV", "development")
    return url_for_public_api(flask_env, API_PATH_DOCUSIGN_OAUTH_CALLBACK)
