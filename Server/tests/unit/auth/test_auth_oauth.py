"""
Tests for Google OAuth callback flow (redirect-based handler).
"""

from unittest.mock import patch

from flask import Flask


class TestOAuthCallback:
    """Exercise ``handle_google_oauth_callback`` with patched Google services."""

    def test_successful_google_oauth_callback(self, app: Flask, db_session):
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args = {"code": "oauth_code_123", "state": "state_token_123"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            with (
                patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=True),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "exchange_code_for_tokens",
                    return_value={
                        "access_token": "mock_google_access_token",
                        "refresh_token": "mock_google_refresh",
                    },
                ),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "get_user_info",
                    return_value={
                        "id": "google-sub-123",
                        "email": "oauth-success@example.com",
                        "name": "OAuth User",
                        "verified_email": True,
                    },
                ),
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_access_token",
                    return_value="minimal_access",
                ),
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_id_token",
                    return_value="minimal_id",
                ),
                patch.object(oauth_mod, "set_auth_cookies", side_effect=lambda r, **kw: r),
            ):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                assert "google=success" in (resp.headers.get("Location") or "")

    def test_oauth_callback_invalid_code(self, app: Flask):
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args = {"code": "invalid_code", "state": "state_token_123"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            with (
                patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=True),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "exchange_code_for_tokens",
                    side_effect=Exception("Invalid authorization code"),
                ),
            ):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                assert "error=" in (resp.headers.get("Location") or "").lower()

    def test_oauth_callback_missing_code(self, app: Flask):
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args: dict = {"state": "state_token_123"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            with patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=True):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                loc = resp.headers.get("Location") or ""
                assert "missing_code" in loc.lower()

    def test_oauth_callback_invalid_state(self, app: Flask):
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args = {"code": "oauth_code_123", "state": "wrong"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            with patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=False):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                assert "invalid_state" in (resp.headers.get("Location") or "").lower()

    def test_oauth_callback_creates_new_user(self, app: Flask, db_session):
        from app import db
        from app.models import User
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args = {"code": "oauth_code_123", "state": "state_token_123"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            assert User.query.filter_by(email="newuser-oauth@example.com").first() is None
            with (
                patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=True),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "exchange_code_for_tokens",
                    return_value={"access_token": "at", "refresh_token": "rt"},
                ),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "get_user_info",
                    return_value={
                        "id": "google-sub-new-456",
                        "email": "newuser-oauth@example.com",
                        "name": "New User",
                        "verified_email": True,
                    },
                ),
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_access_token",
                    return_value="minimal_access",
                ),
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_id_token",
                    return_value="minimal_id",
                ),
                patch.object(oauth_mod, "set_auth_cookies", side_effect=lambda r, **kw: r),
            ):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                created = User.query.filter_by(email="newuser-oauth@example.com").first()
                assert created is not None
                assert created.google_id == "google-sub-new-456"
                db.session.delete(created)
                db.session.commit()

    def test_oauth_callback_token_creation(self, app: Flask, db_session):
        from app.services.auth.flows import oauth_callback as oauth_mod

        request_args = {"code": "oauth_code_123", "state": "state_token_123"}
        session_data = {"google_auth_oauth_state": "state_token_123"}

        with app.app_context():
            with (
                patch.object(oauth_mod.google_oauth_service, "validate_state", return_value=True),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "exchange_code_for_tokens",
                    return_value={"access_token": "at", "refresh_token": "rt"},
                ),
                patch.object(
                    oauth_mod.google_oauth_service,
                    "get_user_info",
                    return_value={
                        "id": "google-sub-tok",
                        "email": "tokuser@example.com",
                        "name": "Tok User",
                        "verified_email": True,
                    },
                ),
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_access_token",
                    return_value="minimal_access",
                ) as mock_at,
                patch.object(
                    oauth_mod.minimal_token_service,
                    "create_minimal_id_token",
                    return_value="minimal_id",
                ),
                patch.object(oauth_mod, "set_auth_cookies", side_effect=lambda r, **kw: r),
            ):
                resp = oauth_mod.handle_google_oauth_callback(request_args, session_data, "req-123")
                assert resp.status_code == 302
                mock_at.assert_called_once()
