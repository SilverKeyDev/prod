"""SkySlope OAuth and API configuration.

Redirect URI from app/config/_urls.py (get_skyslope_redirect_uri).
Client ID and secret from env: SKYSLOPE_ACCESS_KEY, SKYSLOPE_SECRET.
"""

import os

from ._urls import get_skyslope_redirect_uri


def get_skyslope_config():
    """Return SkySlope config dict. Redirect URI from _urls.py."""
    return {
        "client_id": os.getenv("SKYSLOPE_ACCESS_KEY", ""),
        "client_secret": os.getenv("SKYSLOPE_SECRET", ""),
        "redirect_uri": get_skyslope_redirect_uri(),
        "authorize_url": "https://accounts.skyslope.com/oauth2/authorize",
        "token_url": "https://accounts.skyslope.com/oauth2/token",
        "api_base": "https://forms.skyslope.com/partner/api",
    }


def is_skyslope_configured():
    """Check if SkySlope credentials are present."""
    return bool(get_skyslope_config()["client_id"] and get_skyslope_config()["client_secret"])
