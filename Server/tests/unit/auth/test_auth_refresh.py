"""
Tests for authentication token refresh flow
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestRefreshFlow:
    """Test token refresh flow"""

    def test_successful_token_refresh(self, app: Flask, mock_cognito_service):
        """Test successful token refresh"""
        from app.services.auth.flows.refresh import handle_refresh_token

        with app.app_context():
            with patch(
                "app.services.auth.utils.token_creation.create_minimal_tokens"
            ) as mock_create_tokens:
                mock_create_tokens.return_value = (
                    "new_access_token",
                    "new_id_token",
                )

                response, status_code = handle_refresh_token(
                    "mock_refresh_token", "req-123"
                )

                assert status_code == 200
                response_json = response.get_json()
                assert response_json["success"] is True
                assert "access_token" in response_json
                assert "id_token" in response_json
                mock_cognito_service.refresh_tokens.assert_called_once()

    def test_refresh_with_invalid_token(self, app: Flask, mock_cognito_service):
        """Test refresh with invalid refresh token"""
        from app.services.auth.flows.refresh import handle_refresh_token

        mock_cognito_service.refresh_tokens.return_value = {
            "success": False,
            "error": "NotAuthorizedException",
            "message": "Invalid refresh token",
        }

        with app.app_context():
            response, status_code = handle_refresh_token("invalid_token", "req-123")

            assert status_code == 401
            response_json = response.get_json()
            assert response_json["success"] is False
            assert "error" in response_json

    def test_refresh_with_expired_token(self, app: Flask, mock_cognito_service):
        """Test refresh with expired refresh token"""
        from app.services.auth.flows.refresh import handle_refresh_token

        mock_cognito_service.refresh_tokens.return_value = {
            "success": False,
            "error": "NotAuthorizedException",
            "message": "Refresh token has expired",
        }

        with app.app_context():
            response, status_code = handle_refresh_token("expired_token", "req-123")

            assert status_code == 401
            response_json = response.get_json()
            assert response_json["success"] is False
            assert "expired" in response_json["message"].lower()

    def test_refresh_updates_cookies(self, app: Flask, mock_cognito_service):
        """Test refresh updates auth cookies"""
        from app.services.auth.flows.refresh import handle_refresh_token

        with app.app_context():
            with patch(
                "app.services.auth.utils.token_creation.create_minimal_tokens"
            ) as mock_create_tokens:
                with patch(
                    "app.services.auth.utils.cookies.set_auth_cookies"
                ) as mock_set_cookies:
                    mock_create_tokens.return_value = (
                        "new_access_token",
                        "new_id_token",
                    )
                    mock_set_cookies.return_value = Mock()

                    response, status_code = handle_refresh_token(
                        "mock_refresh_token", "req-123"
                    )

                    assert status_code == 200
                    # Verify cookies were set
                    mock_set_cookies.assert_called()


class TestRefreshHandlers:
    """Test refresh handler utilities"""

    def test_extract_refresh_token_from_cookie(self, app: Flask):
        """Test extracting refresh token from cookie"""
        from app.services.auth.flows.refresh_handlers import (
            extract_refresh_token_from_cookie,
        )

        with app.test_request_context(
            "/", headers={"Cookie": "refresh_token=test_token_123"}
        ):
            token = extract_refresh_token_from_cookie()
            assert token == "test_token_123"

    def test_extract_refresh_token_missing(self, app: Flask):
        """Test extracting refresh token when missing"""
        from app.services.auth.flows.refresh_handlers import (
            extract_refresh_token_from_cookie,
        )

        with app.test_request_context("/"):
            token = extract_refresh_token_from_cookie()
            assert token is None

    def test_validate_refresh_token_format(self, app: Flask):
        """Test refresh token format validation"""
        from app.services.auth.flows.refresh_handlers import validate_refresh_token

        with app.app_context():
            # Valid token format
            assert validate_refresh_token("valid_token_123") is True

            # Empty token
            assert validate_refresh_token("") is False
            assert validate_refresh_token(None) is False

            # Token too short
            assert validate_refresh_token("abc") is False
