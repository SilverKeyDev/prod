"""
Tests for OAuth callback flow
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestOAuthCallback:
    """Test OAuth callback flow"""

    def test_successful_google_oauth_callback(
        self, app: Flask, mock_cognito_service, db_session
    ):
        """Test successful Google OAuth callback"""
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            with patch(
                "app.services.auth.core.google_oauth_service.GoogleOAuthService.exchange_code_for_tokens"
            ) as mock_exchange:
                with patch(
                    "app.services.auth.user.lookup.find_or_create_user_by_cognito"
                ) as mock_find_user:
                    mock_exchange.return_value = {
                        "id_token": "mock_google_id_token",
                        "access_token": "mock_google_access_token",
                        "email": "test@example.com",
                        "name": "Test User",
                        "sub": "google-sub-123",
                    }

                    mock_user = Mock()
                    mock_user.id = "user-123"
                    mock_user.name = "Test User"
                    mock_find_user.return_value = mock_user

                    data = {"code": "oauth_code_123", "state": "state_token_123"}
                    response, status_code = handle_oauth_callback(data, "req-123")

                    assert status_code == 200
                    response_json = response.get_json()
                    assert response_json["success"] is True
                    mock_exchange.assert_called_once()

    def test_oauth_callback_invalid_code(self, app: Flask):
        """Test OAuth callback with invalid code"""
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            with patch(
                "app.services.auth.core.google_oauth_service.GoogleOAuthService.exchange_code_for_tokens"
            ) as mock_exchange:
                mock_exchange.side_effect = Exception("Invalid authorization code")

                data = {"code": "invalid_code", "state": "state_token_123"}
                response, status_code = handle_oauth_callback(data, "req-123")

                assert status_code == 400
                response_json = response.get_json()
                assert response_json["success"] is False

    def test_oauth_callback_missing_state(self, app: Flask):
        """Test OAuth callback with missing state parameter"""
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            data = {"code": "oauth_code_123"}
            response, status_code = handle_oauth_callback(data, "req-123")

            assert status_code == 400
            response_json = response.get_json()
            assert response_json["success"] is False
            assert "state" in response_json["message"].lower()

    def test_oauth_callback_state_mismatch(self, app: Flask):
        """Test OAuth callback with state mismatch (CSRF protection)"""
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            with patch(
                "app.services.auth.flows.oauth_callback.validate_oauth_state"
            ) as mock_validate:
                mock_validate.return_value = False

                data = {"code": "oauth_code_123", "state": "invalid_state"}
                response, status_code = handle_oauth_callback(data, "req-123")

                assert status_code == 400
                response_json = response.get_json()
                assert response_json["success"] is False
                assert "state" in response_json["message"].lower()

    def test_oauth_callback_creates_new_user(self, app: Flask, db_session):
        """Test OAuth callback creates new user in database"""
        from app.models import User
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            with patch(
                "app.services.auth.core.google_oauth_service.GoogleOAuthService.exchange_code_for_tokens"
            ) as mock_exchange:
                with patch(
                    "app.services.auth.user.lookup.find_or_create_user_by_cognito"
                ) as mock_find_user:
                    mock_exchange.return_value = {
                        "id_token": "mock_google_id_token",
                        "access_token": "mock_google_access_token",
                        "email": "newuser@example.com",
                        "name": "New User",
                        "sub": "google-sub-456",
                    }

                    # Simulate new user creation
                    new_user = Mock()
                    new_user.id = "new-user-456"
                    new_user.name = "New User"
                    new_user.email = "newuser@example.com"
                    mock_find_user.return_value = new_user

                    data = {"code": "oauth_code_123", "state": "state_token_123"}
                    response, status_code = handle_oauth_callback(data, "req-123")

                    assert status_code == 200
                    mock_find_user.assert_called_once()

    def test_oauth_callback_token_creation(self, app: Flask):
        """Test OAuth callback creates proper auth tokens"""
        from app.services.auth.flows.oauth_callback import handle_oauth_callback

        with app.app_context():
            with patch(
                "app.services.auth.core.google_oauth_service.GoogleOAuthService.exchange_code_for_tokens"
            ) as mock_exchange:
                with patch(
                    "app.services.auth.user.lookup.find_or_create_user_by_cognito"
                ) as mock_find_user:
                    with patch(
                        "app.services.auth.utils.token_creation.create_minimal_tokens"
                    ) as mock_create_tokens:
                        mock_exchange.return_value = {
                            "id_token": "mock_google_id_token",
                            "access_token": "mock_google_access_token",
                            "email": "test@example.com",
                            "name": "Test User",
                            "sub": "google-sub-123",
                        }

                        mock_user = Mock()
                        mock_user.id = "user-123"
                        mock_user.name = "Test User"
                        mock_find_user.return_value = mock_user

                        mock_create_tokens.return_value = (
                            "minimal_access",
                            "minimal_id",
                        )

                        data = {"code": "oauth_code_123", "state": "state_token_123"}
                        response, status_code = handle_oauth_callback(data, "req-123")

                        assert status_code == 200
                        mock_create_tokens.assert_called_once()
