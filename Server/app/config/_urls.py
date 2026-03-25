import os

# ---------------------------------------------------------------------------
# SkySlope Partner OAuth
# ---------------------------------------------------------------------------
# Required in `.env` only: SKYSLOPE_ACCESS_KEY + SKYSLOPE_SECRET (client_id / secret).
# Authorize URL, token URL, redirect URI, and issuer are controlled here — not via env.
#
# OIDC discovery (verify issuer + endpoints):
#   https://id.skyslope.com/oauth2/aush1zfdxi1sIfBms4x7/.well-known/openid-configuration
# Partner API docs: https://forms.skyslope.com/partner/api/docs
#
# Set True only if SkySlope has your app on legacy accounts.skyslope.com only.
SKYSLOPE_OAUTH_USE_LEGACY_ACCOUNTS: bool = False

# Okta authorization server issuer (no trailing slash). Change if SkySlope rotates the server id.
SKYSLOPE_OIDC_ISSUER: str = "https://id.skyslope.com/oauth2/aush1zfdxi1sIfBms4x7"

# If non-empty, used as OAuth redirect URI instead of FLASK_ENV-based defaults below.
SKYSLOPE_REDIRECT_URI_OVERRIDE: str = ""

# Space-separated scopes for id.skyslope.com (Okta). Must match what this authorization server
# allows — see scopes_supported in .well-known/openid-configuration (openid, profile,
# offline_access are listed there). The string "user_access" is not in that list and tends to
# produce HTTP 400 from /v1/authorize. If SkySlope assigns Partner API scopes (e.g.
# forms.files.read), append them here per their written guidance.
SKYSLOPE_OAUTH_SCOPE_OKTA: str = "openid profile offline_access"


def get_skyslope_oauth_scope() -> str:
    """OAuth scope string for authorize request (legacy vs Okta)."""
    if SKYSLOPE_OAUTH_USE_LEGACY_ACCOUNTS:
        return "user_access"
    return SKYSLOPE_OAUTH_SCOPE_OKTA.strip()


def get_skyslope_oauth_issuer() -> str | None:
    """
    OAuth issuer base URL (no trailing slash), or None when using legacy accounts.* hosts.
    """
    if SKYSLOPE_OAUTH_USE_LEGACY_ACCOUNTS:
        return None
    return SKYSLOPE_OIDC_ISSUER.strip().rstrip("/")


def get_skyslope_oauth_authorize_url() -> str:
    """Partner OAuth authorize URL (derived from issuer or legacy accounts host)."""
    issuer = get_skyslope_oauth_issuer()
    if issuer:
        return f"{issuer}/v1/authorize"
    return "https://accounts.skyslope.com/oauth2/authorize"


def get_skyslope_oauth_token_url() -> str:
    """Partner OAuth token URL (derived from issuer or legacy accounts host)."""
    issuer = get_skyslope_oauth_issuer()
    if issuer:
        return f"{issuer}/v1/token"
    return "https://accounts.skyslope.com/oauth2/token"


def get_google_redirect_uri():
    """Get Google Calendar OAuth redirect URI (must match Google Cloud Console)."""
    explicit = os.getenv("GOOGLE_REDIRECT_URI", "").strip()
    if explicit:
        return explicit
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/google/oauth/callback"
    # Development: Flask backend — OAuth callback is an API route, not the Vite dev server
    return "http://localhost:5000/api/v1/google/oauth/callback"


def get_skyslope_redirect_uri():
    """SkySlope OAuth redirect URI: override constant above, else FLASK_ENV defaults."""
    override = SKYSLOPE_REDIRECT_URI_OVERRIDE.strip()
    if override:
        return override
    flask_env = os.getenv("FLASK_ENV", "development")
    if flask_env == "production":
        return "https://usesilverkey.com/api/v1/skyslope/callback"
    # Development: Flask API port (not Vite)
    return "http://localhost:5000/api/v1/skyslope/callback"


def get_frontend_url():
    """Get frontend URL based on environment."""
    flask_env = os.getenv("FLASK_ENV", "development")

    if flask_env == "production":
        return "https://usesilverkey.com"
    # Development: use localhost with port 5173 (Vite dev server)
    return "http://localhost:5173"
