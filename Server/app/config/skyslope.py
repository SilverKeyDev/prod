"""SkySlope OAuth and API configuration.

Redirect URI from app/config/_urls.py (get_skyslope_redirect_uri).
Client ID and secret from env: SKYSLOPE_ACCESS_KEY, SKYSLOPE_SECRET.
OAuth URLs and scope can be overridden via env for id.skyslope.com or custom scopes.
Optional HMAC keys (SKYSLOPE_HMAC_ACCESS_KEY, SKYSLOPE_HMAC_ACCESS_SECRET) for
api.skyslope.com server-to-server auth; see app.services.skyslope.hmac_auth.
"""

import os

from ._urls import get_skyslope_redirect_uri

_DEFAULT_AUTHORIZE_URL = "https://accounts.skyslope.com/oauth2/authorize"
_DEFAULT_TOKEN_URL = "https://accounts.skyslope.com/oauth2/token"
_DEFAULT_API_BASE = "https://forms.skyslope.com/partner/api"


def _parse_bool_env(name: str, default: bool = False) -> bool:
    """Parse env as boolean. 'true'/'1'/'yes' -> True; else False unless default."""
    val = os.getenv(name, "").strip().lower()
    if val in ("true", "1", "yes"):
        return True
    if val in ("false", "0", "no", ""):
        return default
    return default


def get_skyslope_config():
    """Return SkySlope config dict. Redirect URI from _urls.py."""
    return {
        "client_id": os.getenv("SKYSLOPE_ACCESS_KEY", ""),
        "client_secret": os.getenv("SKYSLOPE_SECRET", ""),
        "redirect_uri": get_skyslope_redirect_uri(),
        "authorize_url": os.getenv("SKYSLOPE_AUTHORIZE_URL", _DEFAULT_AUTHORIZE_URL).strip()
        or _DEFAULT_AUTHORIZE_URL,
        "token_url": os.getenv("SKYSLOPE_TOKEN_URL", _DEFAULT_TOKEN_URL).strip()
        or _DEFAULT_TOKEN_URL,
        "api_base": os.getenv("SKYSLOPE_API_BASE", _DEFAULT_API_BASE).strip()
        or _DEFAULT_API_BASE,
        "scope": os.getenv("SKYSLOPE_SCOPE", "user_access").strip() or "user_access",
        "use_pkce": _parse_bool_env("SKYSLOPE_USE_PKCE", False),
        "hmac_access_key": os.getenv("SKYSLOPE_HMAC_ACCESS_KEY", "").strip(),
        "hmac_access_secret": os.getenv("SKYSLOPE_HMAC_ACCESS_SECRET", "").strip(),
    }


def is_skyslope_configured():
    """Check if SkySlope credentials are present."""
    return bool(get_skyslope_config()["client_id"] and get_skyslope_config()["client_secret"])


def is_skyslope_hmac_configured():
    """Check if HMAC credentials for api.skyslope.com are present."""
    cfg = get_skyslope_config()
    return bool(
        cfg["client_id"]
        and cfg["client_secret"]
        and cfg["hmac_access_key"]
        and cfg["hmac_access_secret"]
    )
