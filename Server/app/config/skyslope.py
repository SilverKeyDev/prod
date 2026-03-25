"""SkySlope configuration.

**Environment (Partner OAuth):** only ``SKYSLOPE_ACCESS_KEY`` and ``SKYSLOPE_SECRET`` are read
from the environment. OAuth URLs, redirect URI, issuer, scope, and PKCE follow
``app.config._urls`` (edit constants there if SkySlope or deploy hostname change).

**Optional HMAC** (``api.skyslope.com`` REST only): set ``SKYSLOPE_HMAC_ACCESS_KEY`` and
``SKYSLOPE_HMAC_ACCESS_SECRET`` in the environment if you use that surface; they are not
required for the Partner / Forms OAuth flow. See ``app.services.skyslope.hmac_auth``.
"""

from __future__ import annotations

import os

from ._urls import (
    get_skyslope_oauth_authorize_url,
    get_skyslope_oauth_scope,
    get_skyslope_oauth_token_url,
    get_skyslope_redirect_uri,
)

_DEFAULT_API_BASE = "https://forms.skyslope.com/partner/api"
_DEFAULT_HMAC_LOGIN_URL = "https://api.skyslope.com/auth/login"
_DEFAULT_HMAC_API_BASE = "https://api.skyslope.com"


def _authorize_uses_id_skyslope(authorize_url: str) -> bool:
    return "id.skyslope.com" in authorize_url.lower()


def _use_pkce_for_authorize_url(authorize_url: str) -> bool:
    """Okta (id.skyslope.com) expects PKCE; legacy accounts host does not."""
    return _authorize_uses_id_skyslope(authorize_url)


def get_skyslope_config():
    """Return SkySlope config. OAuth URLs from ``_urls``; only client id/secret from env."""
    authorize_url = get_skyslope_oauth_authorize_url()
    token_url = get_skyslope_oauth_token_url()
    return {
        "client_id": os.getenv("SKYSLOPE_ACCESS_KEY", ""),
        "client_secret": os.getenv("SKYSLOPE_SECRET", ""),
        "redirect_uri": get_skyslope_redirect_uri(),
        "authorize_url": authorize_url,
        "token_url": token_url,
        "api_base": _DEFAULT_API_BASE,
        "scope": get_skyslope_oauth_scope(),
        "use_pkce": _use_pkce_for_authorize_url(authorize_url),
        "hmac_access_key": os.getenv("SKYSLOPE_HMAC_ACCESS_KEY", "").strip(),
        "hmac_access_secret": os.getenv("SKYSLOPE_HMAC_ACCESS_SECRET", "").strip(),
        "hmac_login_url": os.getenv("SKYSLOPE_HMAC_LOGIN_URL", _DEFAULT_HMAC_LOGIN_URL).strip()
        or _DEFAULT_HMAC_LOGIN_URL,
        "hmac_api_base": os.getenv("SKYSLOPE_HMAC_API_BASE", _DEFAULT_HMAC_API_BASE).strip()
        or _DEFAULT_HMAC_API_BASE,
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
