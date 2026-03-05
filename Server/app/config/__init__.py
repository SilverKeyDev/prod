from dotenv import load_dotenv

# Preserve import-time behavior from the original `Server/app/config.py`
load_dotenv()

# Imports below must follow load_dotenv() so config submodules read env.
from ._config import Config  # noqa: E402
from ._paths import basedir, instance_dir  # noqa: E402, F401
from ._urls import get_frontend_url, get_google_redirect_uri  # noqa: E402
from .aws import *  # noqa: E402, F403
from .constants import *  # noqa: E402, F403
from .database import *  # noqa: E402, F403
from .error_codes import *  # noqa: E402, F403

__all__ = [
    "Config",
    "get_frontend_url",
    "get_google_redirect_uri",
    "basedir",
    "instance_dir",
]
