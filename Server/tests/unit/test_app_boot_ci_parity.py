"""Ensure create_app() boots with CI-style stubs only (no developer .env secrets)."""

from __future__ import annotations

import os

from tests.test_env_stubs import TEST_ENV_STUBS, apply_test_env_stubs


def test_create_app_boots_with_ci_style_stubs_only() -> None:
    """Simulate CI: no integration keys except conftest force-set stubs."""
    snapshot: dict[str, str | None] = {}
    for key in TEST_ENV_STUBS:
        snapshot[key] = os.environ.get(key)

    try:
        for key in TEST_ENV_STUBS:
            os.environ.pop(key, None)

        apply_test_env_stubs()

        from app import create_app

        app = create_app()
        assert app is not None
    finally:
        for key, value in snapshot.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
