from dotenv import load_dotenv

# Preserve import-time behavior from the original `Server/app/config.py`
load_dotenv()

# Ensure instance directory exists on import, same as before
from ._paths import basedir, instance_dir  # noqa: F401

from ._urls import get_frontend_url, get_google_redirect_uri
from .aws import *  # noqa: F403
from .database import *  # noqa: F403
from .error_codes import *  # noqa: F403
from ._config import Config

__all__ = [
    "Config",
    "get_frontend_url",
    "get_google_redirect_uri",
    "basedir",
    "instance_dir",
]

