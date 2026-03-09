"""SkySlope OAuth and API configuration.

Redirect URI is read from Server/config/skyslope.json (copy from
config/skyslope.example.json). Client ID and secret stay in env:
SKYSLOPE_ACCESS_KEY, SKYSLOPE_SECRET.
"""

import json
import os
from pathlib import Path

from ._urls import get_skyslope_redirect_uri

_SKYSLOPE_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "config" / "skyslope.json"


def _load_redirect_uri_from_file() -> str:
    """Load redirect_uri from config file. Returns empty string if missing/invalid."""
    if not _SKYSLOPE_CONFIG_PATH.exists():
        return ""
    try:
        with open(_SKYSLOPE_CONFIG_PATH, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and data.get("redirect_uri"):
            return (data.get("redirect_uri") or "").strip()
    except (json.JSONDecodeError, OSError):
        pass
    return ""


def get_skyslope_config():
    """Return SkySlope config dict. Redirect URI from config file, then env, then FLASK_ENV default."""
    redirect_uri = (
        _load_redirect_uri_from_file()
        or os.getenv("SKYSLOPE_REDIRECT_URI", "").strip()
        or get_skyslope_redirect_uri()
    )

    return {
        "client_id": os.getenv("SKYSLOPE_ACCESS_KEY", ""),
        "client_secret": os.getenv("SKYSLOPE_SECRET", ""),
        "redirect_uri": redirect_uri,
        "authorize_url": "https://accounts.skyslope.com/oauth2/authorize",
        "token_url": "https://accounts.skyslope.com/oauth2/token",
        "api_base": "https://forms.skyslope.com/partner/api",
    }


def is_skyslope_configured():
    """Check if SkySlope credentials are present."""
    return bool(get_skyslope_config()["client_id"] and get_skyslope_config()["client_secret"])
