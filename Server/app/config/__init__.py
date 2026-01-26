from dotenv import load_dotenv

# Preserve import-time behavior from the original `Server/app/config.py`
load_dotenv()

# Ensure instance directory exists on import, same as before
from ._paths import basedir, instance_dir  # noqa: F401

from ._urls import get_frontend_url, get_google_redirect_uri, get_docusign_webhook_connect_url, get_docusign_oauth_redirect_uri
from ._constants_docusign import (
    DOCUSIGN_SIGNING_COMPLETE_PATH,
    DOCUSIGN_SENDER_VIEW_PATH,
)
from .aws import *  # noqa: F403
from .database import *  # noqa: F403
from .error_codes import *  # noqa: F403
from ._config import Config

__all__ = [
    "Config",
    "get_frontend_url",
    "get_google_redirect_uri",
    "get_docusign_webhook_connect_url",
    "get_docusign_oauth_redirect_uri",
    "DOCUSIGN_SIGNING_COMPLETE_PATH",
    "DOCUSIGN_SENDER_VIEW_PATH",
    "basedir",
    "instance_dir",
]

