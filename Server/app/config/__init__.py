from dotenv import load_dotenv

# Preserve import-time behavior from the original `Server/app/config.py`
load_dotenv()

# Imports below must follow load_dotenv() so config submodules read env.
from ._config import Config  # noqa: E402
from ._paths import basedir, instance_dir  # noqa: E402, F401
from ._urls import (  # noqa: E402
    SKYSLOPE_OAUTH_USE_LEGACY_ACCOUNTS,
    SKYSLOPE_OIDC_ISSUER,
    SKYSLOPE_REDIRECT_URI_OVERRIDE,
    get_frontend_url,
    get_google_redirect_uri,
    get_skyslope_oauth_authorize_url,
    get_skyslope_oauth_issuer,
    get_skyslope_oauth_scope,
    get_skyslope_oauth_token_url,
    get_skyslope_redirect_uri,
)
from .aws import *  # noqa: E402, F403
from .constants import *  # noqa: E402, F403
from .database import *  # noqa: E402, F403
from .error_codes import *  # noqa: E402, F403

__all__ = [
    "Config",
    "SKYSLOPE_OAUTH_USE_LEGACY_ACCOUNTS",
    "SKYSLOPE_OIDC_ISSUER",
    "SKYSLOPE_REDIRECT_URI_OVERRIDE",
    "get_frontend_url",
    "get_google_redirect_uri",
    "get_skyslope_oauth_authorize_url",
    "get_skyslope_oauth_issuer",
    "get_skyslope_oauth_scope",
    "get_skyslope_oauth_token_url",
    "get_skyslope_redirect_uri",
    "basedir",
    "instance_dir",
]
