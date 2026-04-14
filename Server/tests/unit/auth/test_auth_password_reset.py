"""
Tests for authentication password reset flow
"""

from flask import Flask


class TestPasswordResetFlow:
    """Test password reset flow"""

    def test_successful_forgot_password_request(self, app: Flask, mock_cognito_service):
        """Test successful forgot password request"""
        from app.services.auth.flows.password_reset import handle_forgot_password

        with app.app_context():
            data = {"email": "test@example.com"}
            response_data, status_code = handle_forgot_password(data, "req-123")

            assert status_code == 200
            assert response_data["success"] is True
            assert "code" in response_data["message"].lower()
            mock_cognito_service.forgot_password.assert_called_once()

    def test_forgot_password_user_not_found(self, app: Flask, mock_cognito_service):
        """Test forgot password for non-existent user"""
        from app.services.auth.flows.password_reset import handle_forgot_password

        mock_cognito_service.forgot_password.return_value = {
            "success": False,
            "error": "UserNotFoundException",
            "message": "User does not exist",
        }

        with app.app_context():
            data = {"email": "nonexistent@example.com"}
            response_data, status_code = handle_forgot_password(data, "req-123")

            # Should return generic success message for security
            assert status_code == 200
            assert response_data["success"] is True

    def test_successful_password_reset_confirmation(self, app: Flask, mock_cognito_service):
        """Test successful password reset with code"""
        from app.services.auth.flows.password_reset import (
            handle_confirm_forgot_password,
        )

        with app.app_context():
            data = {
                "email": "test@example.com",
                "confirmation_code": "123456",
                "new_password": "NewPassword123!",
            }
            response_data, status_code = handle_confirm_forgot_password(data, "req-123")

            assert status_code == 200
            assert response_data["success"] is True
            assert "reset" in response_data["message"].lower()
            mock_cognito_service.confirm_forgot_password.assert_called_once()

    def test_password_reset_invalid_code(self, app: Flask, mock_cognito_service):
        """Test password reset with invalid confirmation code"""
        from app.services.auth.flows.password_reset import (
            handle_confirm_forgot_password,
        )

        mock_cognito_service.confirm_forgot_password.return_value = {
            "success": False,
            "error": "CodeMismatchException",
            "message": "Invalid verification code",
        }

        with app.app_context():
            data = {
                "email": "test@example.com",
                "confirmation_code": "999999",
                "new_password": "NewPassword123!",
            }
            response_data, status_code = handle_confirm_forgot_password(data, "req-123")

            assert status_code == 400
            assert response_data["success"] is False
            assert "code" in response_data["message"].lower()

    def test_password_reset_expired_code(self, app: Flask, mock_cognito_service):
        """Test password reset with expired confirmation code"""
        from app.services.auth.flows.password_reset import (
            handle_confirm_forgot_password,
        )

        mock_cognito_service.confirm_forgot_password.return_value = {
            "success": False,
            "error": "ExpiredCodeException",
            "message": "Verification code has expired",
        }

        with app.app_context():
            data = {
                "email": "test@example.com",
                "confirmation_code": "123456",
                "new_password": "NewPassword123!",
            }
            response_data, status_code = handle_confirm_forgot_password(data, "req-123")

            assert status_code == 400
            assert response_data["success"] is False
            assert "expired" in response_data["message"].lower()

    def test_password_reset_weak_password(self, app: Flask, mock_cognito_service):
        """Test password reset with weak new password"""
        from app.services.auth.flows.password_reset import (
            handle_confirm_forgot_password,
        )

        mock_cognito_service.confirm_forgot_password.return_value = {
            "success": False,
            "error": "InvalidPasswordException",
            "message": "Password does not meet requirements",
        }

        with app.app_context():
            data = {
                "email": "test@example.com",
                "confirmation_code": "123456",
                "new_password": "weak",
            }
            response_data, status_code = handle_confirm_forgot_password(data, "req-123")

            assert status_code == 400
            assert response_data["success"] is False
            assert "password" in response_data["message"].lower()
