"""Tests for Google Calendar webhook verification."""

from unittest.mock import patch

from flask import Flask

from app.services.calendar.webhooks import verification


class TestCalendarWebhookVerification:
    def test_accepts_valid_token_and_headers(self, app: Flask):
        with app.app_context():
            with patch.object(verification.Config, "GOOGLE_CALENDAR_WEBHOOK_TOKEN", "secret-token"):
                assert (
                    verification.verify_calendar_webhook(
                        channel_token="secret-token",
                        channel_id="channel-1",
                        resource_id="resource-abc",
                        resource_state="exists",
                    )
                    is True
                )

    def test_rejects_missing_resource_headers(self, app: Flask):
        with app.app_context():
            assert (
                verification.verify_calendar_webhook(
                    channel_token="t",
                    channel_id="c",
                    resource_id=None,
                    resource_state="exists",
                )
                is False
            )

    def test_rejects_invalid_resource_state(self, app: Flask):
        with app.app_context():
            with patch.object(verification.Config, "GOOGLE_CALENDAR_WEBHOOK_TOKEN", "tok"):
                assert (
                    verification.verify_calendar_webhook(
                        channel_token="tok",
                        channel_id="c",
                        resource_id="r1",
                        resource_state="hacked",
                    )
                    is False
                )

    def test_strict_env_requires_token_config(self, app: Flask, monkeypatch):
        monkeypatch.setenv("FLASK_ENV", "production")
        monkeypatch.delenv("TESTING", raising=False)
        with app.app_context():
            with patch.object(verification.Config, "GOOGLE_CALENDAR_WEBHOOK_TOKEN", ""):
                assert (
                    verification.verify_calendar_webhook(
                        channel_token="any",
                        channel_id="c",
                        resource_id="r1",
                        resource_state="sync",
                    )
                    is False
                )
