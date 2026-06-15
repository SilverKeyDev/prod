"""Load ``posthog_constants`` without importing the Flask ``app`` package.

CI endpoint scripts install only ``requests``; they must not pull ``app/__init__.py``
(which needs Flask, DATABASE_URL, and full Server deps).
"""

from __future__ import annotations

import sys
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import ModuleType

_SERVER_DIR = Path(__file__).resolve().parents[2]
_CONSTANTS_PATH = _SERVER_DIR / "app/services/analytics/posthog_constants.py"
_MODULE_NAME = "_silverkey_posthog_constants_script"


def load_posthog_constants() -> ModuleType:
    cached = sys.modules.get(_MODULE_NAME)
    if cached is not None:
        return cached
    if not _CONSTANTS_PATH.is_file():
        raise ImportError(f"posthog_constants_loader: missing {_CONSTANTS_PATH}")
    spec = spec_from_file_location(_MODULE_NAME, _CONSTANTS_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"posthog_constants_loader: cannot load {_CONSTANTS_PATH}")
    module = module_from_spec(spec)
    sys.modules[_MODULE_NAME] = module
    spec.loader.exec_module(module)
    return module
