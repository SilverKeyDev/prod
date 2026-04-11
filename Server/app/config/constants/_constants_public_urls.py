"""
Public URLs and browser-safe origins for SilverKey (production + local dev).

Secrets, API keys, and private endpoints do not belong here — only stable,
non-sensitive hostnames and path suffixes used to build OAuth callbacks,
webhooks, and CORS allowlists.
"""

# Production site (SPA and API share this host in current deployment)
PUBLIC_PRODUCTION_ORIGIN = "https://usesilverkey.com"
PUBLIC_PRODUCTION_ORIGIN_WWW = "https://www.usesilverkey.com"

# Local development
DEV_API_ORIGIN = "http://localhost:5000"
DEV_FRONTEND_ORIGIN = "http://localhost:5173"
DEV_FRONTEND_ORIGIN_LOOPBACK = "http://127.0.0.1:5173"
DEV_FRONTEND_ORIGIN_ALT = "http://localhost:3000"

# API path suffixes (joined with production or dev API origin)
API_PATH_GOOGLE_CALENDAR_OAUTH_CALLBACK = "/api/v1/google/oauth/callback"
API_PATH_GOOGLE_AUTH_CALLBACK = "/api/v1/auth/google/callback"
API_PATH_DOCUSIGN_CONNECT_WEBHOOK = "/api/v1/webhooks/docusign/connect"
API_PATH_DOCUSIGN_OAUTH_CALLBACK = "/api/v1/docusign/oauth/callback"


def public_api_origin_for_flask_env(flask_env: str) -> str:
    """Backend base URL used for OAuth callbacks and webhooks (Flask)."""
    if flask_env == "production":
        return PUBLIC_PRODUCTION_ORIGIN
    return DEV_API_ORIGIN


def public_frontend_origin_for_flask_env(flask_env: str) -> str:
    """Frontend base URL (Vite dev server or production site)."""
    if flask_env == "production":
        return PUBLIC_PRODUCTION_ORIGIN
    return DEV_FRONTEND_ORIGIN


def url_for_public_api(flask_env: str, path: str) -> str:
    """Build full API URL for OAuth/webhook routes (same host as site in prod)."""
    base = public_api_origin_for_flask_env(flask_env)
    return f"{base}{path}"
