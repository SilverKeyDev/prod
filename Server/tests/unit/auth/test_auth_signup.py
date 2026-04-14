"""
Tests for authentication signup flow
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestSignupFlow:
    """Test signup flow handler"""

    def test_successful_signup(self, app: Flask, mock_cognito_service, db_session):
        """Test successful user signup"""
        from app.services.auth.flows.signup import handle_signup

        with app.app_context():
            data = {
                "email": "newuser@example.com",
                "password": "Password123!",
                "name": "New User",
                "phone": "+1234567890",
            }
            response_data, status_code = handle_signup(data)

            assert status_code == 201
            assert response_data["success"] is True
            assert "user_sub" in response_data
            assert "verification" in response_data["message"].lower()
            mock_cognito_service.sign_up.assert_called_once()

    def test_signup_without_phone(self, app: Flask, mock_cognito_service, db_session):
        """Test signup without phone number"""
        from app.services.auth.flows.signup import handle_signup

        with app.app_context():
            data = {
                "email": "newuser@example.com",
                "password": "Password123!",
                "name": "New User",
            }
            response_data, status_code = handle_signup(data)

            assert status_code == 201
            assert response_data["success"] is True
            # Verify phone attribute not included
            call_args = mock_cognito_service.sign_up.call_args
            user_attributes = call_args[1]["user_attributes"]
            phone_attrs = [
                attr for attr in user_attributes if attr["Name"] == "phone_number"
            ]
            assert len(phone_attrs) == 0

    def test_signup_with_existing_email(self, app: Flask, mock_cognito_service):
        """Test signup with already registered email"""
        from app.services.auth.flows.signup import handle_signup

        mock_cognito_service.sign_up.return_value = {
            "success": False,
            "error": "UsernameExistsException",
            "message": "An account with this email already exists",
        }

        with app.app_context():
            data = {
                "email": "existing@example.com",
                "password": "Password123!",
                "name": "Test User",
            }
            response_data, status_code = handle_signup(data)

            assert status_code == 400
            assert response_data["success"] is False
            assert "error" in response_data

    def test_signup_with_weak_password(self, app: Flask, mock_cognito_service):
        """Test signup with weak password"""
        from app.services.auth.flows.signup import handle_signup

        mock_cognito_service.sign_up.return_value = {
            "success": False,
            "error": "InvalidPasswordException",
            "message": "Password does not meet requirements",
        }

        with app.app_context():
            data = {
                "email": "newuser@example.com",
                "password": "weak",
                "name": "Test User",
            }
            response_data, status_code = handle_signup(data)

            assert status_code == 400
            assert response_data["success"] is False
            assert "password" in response_data["message"].lower()

    def test_signup_creates_database_user(
        self, app: Flask, mock_cognito_service, db_session
    ):
        """Test signup creates user in database"""
        from app.models import User
        from app.services.auth.flows.signup import handle_signup

        with app.app_context():
            data = {
                "email": "newuser@example.com",
                "password": "Password123!",
                "name": "New User",
                "phone": "+1234567890",
            }
            response_data, status_code = handle_signup(data)

            assert status_code == 201
            # Verify user created in database
            user = User.query.filter_by(email=data["email"]).first()
            assert user is not None
            assert user.email == data["email"]
            assert user.name == data["name"]
            assert user.phone == data["phone"]
            assert user.cognito_id == response_data["user_sub"]

    def test_signup_handles_database_error_gracefully(
        self, app: Flask, mock_cognito_service, db_session
    ):
        """Test signup continues even if database creation fails"""
        from app.services.auth.flows.signup import handle_signup

        with app.app_context():
            with patch("app.db.session.add", side_effect=Exception("DB Error")):
                data = {
                    "email": "newuser@example.com",
                    "password": "Password123!",
                    "name": "New User",
                }
                response_data, status_code = handle_signup(data)

                # Signup should still succeed (Cognito user created)
                assert status_code == 201
                assert response_data["success"] is True
