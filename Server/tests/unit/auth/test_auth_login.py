"""
Tests for authentication login flow
"""

from unittest.mock import Mock, patch

from flask import Flask


class TestLoginFlow:
    """Test login flow handler"""

    def test_successful_login(self, app: Flask, mock_cognito_service, mock_jwt_decode, sample_user):
        """Test successful login flow"""
        from app.services.auth.flows.login import handle_login

        with app.app_context():
            with patch(
                "app.services.auth.flows.login.find_or_create_user_by_cognito"
            ) as mock_find_user:
                from types import SimpleNamespace

                mock_user = SimpleNamespace(
                    id=sample_user["id"],
                    name=sample_user["name"],
                    phone=sample_user["phone"],
                    google_id=None,
                    cognito_id=sample_user["cognito_id"],
                    email=sample_user["email"],
                )
                mock_find_user.return_value = mock_user

                data = {"email": "test@example.com", "password": "Password123!"}
                response, status_code = handle_login(data, "req-123")

                assert status_code == 200
                assert response.status_code == 200
                mock_cognito_service.sign_in.assert_called_once_with(
                    username=data["email"], password=data["password"]
                )
                mock_find_user.assert_called_once()

    def test_login_invalid_credentials(self, app: Flask, mock_cognito_service):
        """Test login with invalid credentials"""
        from app.services.auth.flows.login import handle_login

        mock_cognito_service.sign_in.return_value = {
            "success": False,
            "error": "NotAuthorizedException",
            "message": "Incorrect username or password",
        }

        with app.app_context():
            data = {"email": "test@example.com", "password": "WrongPassword"}
            response, status_code = handle_login(data, "req-123")

            assert status_code == 401
            response_json = response.get_json()
            assert response_json["success"] is False
            assert "error" in response_json

    def test_login_unverified_user(self, app: Flask, mock_cognito_service, sample_user):
        """Test login for unverified user triggers verification code resend"""
        from app.services.auth.flows.login import handle_login

        mock_cognito_service.sign_in.return_value = {
            "success": False,
            "needs_verification": True,
            "error": "UserNotConfirmedException",
        }

        mock_cognito_service.client.resend_confirmation_code = Mock(
            return_value={"CodeDeliveryDetails": {"Destination": "t***@example.com"}}
        )

        with app.app_context():
            data = {"email": "test@example.com", "password": "Password123!"}
            response, status_code = handle_login(data, "req-123")

            assert status_code == 401
            response_json = response.get_json()
            assert response_json["success"] is False
            assert response_json.get("needs_verification") is True
            assert "verification" in response_json["message"].lower()
            mock_cognito_service.client.resend_confirmation_code.assert_called_once()

    def test_login_token_decode_error(self, app: Flask, mock_cognito_service, mock_jwt_decode):
        """Test login handles token decode errors"""
        from app.services.auth.flows.login import handle_login

        mock_jwt_decode.side_effect = Exception("Token decode failed")

        with app.app_context():
            with patch("app.services.auth.user.lookup.find_or_create_user_by_cognito"):
                data = {"email": "test@example.com", "password": "Password123!"}
                response, status_code = handle_login(data, "req-123")

                assert status_code == 500
                response_json = response.get_json()
                assert response_json["success"] is False
                assert response_json["error"] == "TOKEN_DECODE_ERROR"

    def test_login_missing_success_key(self, app: Flask, mock_cognito_service):
        """Test login handles malformed Cognito response"""
        from app.services.auth.flows.login import handle_login

        mock_cognito_service.sign_in.return_value = {"tokens": {}}

        with app.app_context():
            data = {"email": "test@example.com", "password": "Password123!"}
            response, status_code = handle_login(data, "req-123")

            assert status_code == 500
            response_json = response.get_json()
            assert response_json["success"] is False
            assert response_json["error"] == "INVALID_RESPONSE"
