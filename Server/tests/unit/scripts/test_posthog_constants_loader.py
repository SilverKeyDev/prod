"""Tests for CI PostHog scripts loading constants without the Flask app."""

from __future__ import annotations

from scripts.endpoints.posthog_constants_loader import load_posthog_constants


def test_load_posthog_constants_without_flask_app_package() -> None:
    mod = load_posthog_constants()
    assert mod.POSTHOG_CAPTURE_URL == "https://us.i.posthog.com/capture/"
    assert mod.POSTHOG_PROJECT_ID == "441667"
    assert "441667" in mod.POSTHOG_QUERY_URL
