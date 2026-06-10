"""
Tests for authentication verification flow
"""

from unittest.mock import Mock, patch

from flask import Flask

from app.services.auth.flows import verification as verification_mod


class TestVerificationFlow:
    """Test email verification flow"""

    def test_successful_email_verification(self, app: Flask, mock_cognito_service):
        """Test successful email verification"""
        from app.services.auth.flows.verification import handle_verify_email

        mock_cognito_service.confirm_sign_up = Mock(return_value={"success": True})

        with app.app_context():
            data = {"email": "test@example.com", "confirmation_code": "123456"}
            response_data, status_code = handle_verify_email(data, "req-123")

            assert status_code == 200
            assert response_data["success"] is True
            assert "verified" in response_data["message"].lower()
            mock_cognito_service.confirm_sign_up.assert_called_once()

    def test_verification_invalid_code(self, app: Flask, mock_cognito_service):
        """Test verification with invalid code"""
        from app.services.auth.flows.verification import handle_verify_email

        mock_cognito_service.confirm_sign_up = Mock(
            return_value={
                "success": False,
                "error": "CodeMismatchException",
                "message": "Invalid verification code",
            }
        )

        with app.app_context():
            data = {"email": "test@example.com", "confirmation_code": "999999"}
            response_data, status_code = handle_verify_email(data, "req-123")

            assert status_code == 400
            assert response_data["success"] is False
            assert "invalid" in response_data["message"].lower()

    def test_verification_expired_code(self, app: Flask, mock_cognito_service):
        """Test verification with expired code"""
        from app.services.auth.flows.verification import handle_verify_email

        mock_cognito_service.confirm_sign_up = Mock(
            return_value={
                "success": False,
                "error": "ExpiredCodeException",
                "message": "Verification code has expired",
            }
        )

        with app.app_context():
            data = {"email": "test@example.com", "confirmation_code": "123456"}
            response_data, status_code = handle_verify_email(data, "req-123")

            assert status_code == 400
            assert response_data["success"] is False
            assert "expired" in response_data["message"].lower()

    def test_verification_already_verified(self, app: Flask, mock_cognito_service):
        """Test verification for already verified user"""
        from app.services.auth.flows.verification import handle_verify_email

        mock_cognito_service.confirm_sign_up = Mock(
            return_value={
                "success": False,
                "error": "NotAuthorizedException",
                "message": "User is already confirmed",
            }
        )

        with app.app_context():
            data = {"email": "test@example.com", "confirmation_code": "123456"}
            response_data, status_code = handle_verify_email(data, "req-123")

            # Should still return success for better UX
            assert status_code == 200
            assert response_data["success"] is True

    def test_successful_resend_verification_code(self, app: Flask, mock_cognito_service):
        """Test successful resend verification code"""
        from app.services.auth.flows.verification import handle_resend_code

        with app.app_context():
            with patch.object(
                verification_mod.AWS_COGNITO_service.client,
                "resend_confirmation_code",
                return_value={"CodeDeliveryDetails": {"Destination": "t***@example.com"}},
            ) as mock_resend:
                data = {"email": "test@example.com"}
                response_data, status_code = handle_resend_code(data, "req-123")

                assert status_code == 200
                assert response_data["success"] is True
                assert "sent" in response_data["message"].lower()
                mock_resend.assert_called_once()

    def test_resend_code_user_not_found(self, client, mock_cognito_service):
        """Resend for unknown email returns enumeration-safe success at the route layer."""
        with patch(
            "app.routes.auth.handlers.signup_verify.handle_resend_code",
            return_value=(
                {
                    "success": False,
                    "error": "USER_NOT_FOUND",
                    "message": "No user found with this email",
                },
                404,
            ),
        ):
            response = client.post(
                "/api/v1/auth/resend-code",
                json={"email": "nonexistent@example.com"},
            )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_resend_code_already_verified(self, app: Flask, mock_cognito_service):
        """Test resend code for already verified user"""
        from app.services.auth.flows.verification import handle_resend_code

        with app.app_context():
            with patch.object(
                verification_mod.AWS_COGNITO_service.client,
                "resend_confirmation_code",
                side_effect=verification_mod.AWS_COGNITO_service.client.exceptions.NotAuthorizedException(
                    {"Error": {"Code": "NotAuthorizedException"}}, "resend_confirmation_code"
                ),
            ):
                data = {"email": "test@example.com"}
                response_data, status_code = handle_resend_code(data, "req-123")

                assert status_code == 200
                assert response_data["success"] is True
