"""
Tests for authentication API routes
"""

from unittest.mock import Mock, patch

import jwt

from app.models import User
from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET


class TestAuthRoutes:
    """Test authentication API endpoints"""

    def test_login_endpoint(self, client, mock_cognito_service, mock_jwt_decode):
        """Test POST /api/v1/auth/login"""
        with patch(
            "app.services.auth.user.lookup.find_or_create_user_by_cognito"
        ) as mock_find_user:
            mock_user = Mock()
            mock_user.id = "user-123"
            mock_user.name = "Test User"
            mock_find_user.return_value = mock_user

            response = client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "Password123!"},
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert "user" in data

    def test_login_invalid_credentials(self, client, mock_cognito_service):
        """Test login with invalid credentials"""
        mock_cognito_service.sign_in.return_value = {
            "success": False,
            "error": "NotAuthorizedException",
            "message": "Incorrect username or password",
        }

        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "WrongPassword"},
        )

        assert response.status_code == 401
        data = response.get_json()
        assert data["success"] is False

    def test_signup_endpoint(self, client, mock_cognito_service):
        """Test POST /api/v1/auth/signup"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newuser@example.com",
                "password": "Password123!",
                "name": "New User",
                "phone": "+1234567890",
            },
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data["success"] is True
        assert "user_sub" in data
        mock_cognito_service.sign_up.assert_called_once()
        user_attributes = mock_cognito_service.sign_up.call_args.kwargs["user_attributes"]
        phone_attrs = [a for a in user_attributes if a["Name"] == "phone_number"]
        assert len(phone_attrs) == 1
        assert phone_attrs[0]["Value"] == "+1234567890"

    def test_refresh_token_endpoint(
        self, client, mock_cognito_service, mock_jwt_decode, db_session
    ):
        """Test POST /api/v1/auth/refresh-token (requires session cookie + DB user)"""
        db_session.session.add(
            User(
                id="user-123",
                cognito_id="cognito-refresh-1",
                email="refresh@example.com",
                name="Refresh User",
            )
        )
        db_session.session.commit()

        session_token = jwt.encode(
            {"sub": "user-123", "email": "refresh@example.com"},
            TEST_JWT_HMAC_SECRET,
            algorithm="HS256",
        )
        client.set_cookie(key="session", value=session_token, domain="localhost")
        client.set_cookie(key="refresh_token", value="mock_refresh_token", domain="localhost")

        with patch(
            "app.services.auth.user.lookup.find_or_create_user_by_cognito"
        ) as mock_find_user:
            mock_user = Mock()
            mock_user.id = "user-123"
            mock_user.name = "Refresh User"
            mock_find_user.return_value = mock_user

            with patch(
                "app.services.auth.utils.token_creation.create_minimal_tokens"
            ) as mock_create_tokens:
                mock_create_tokens.return_value = ("new_access", "new_id")

                response = client.post("/api/v1/auth/refresh-token")

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_logout_endpoint(self, client):
        """Test POST /api/v1/auth/logout"""
        response = client.post("/api/v1/auth/logout")

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_verify_email_endpoint(self, client, mock_cognito_service, mock_jwt_decode):
        """Test POST /api/v1/auth/verify"""
        mock_cognito_service.confirm_sign_up = Mock(return_value={"success": True})

        response = client.post(
            "/api/v1/auth/verify",
            json={
                "email": "test@example.com",
                "code": "123456",
                "password": "Password123!",
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_forgot_password_endpoint(self, client, mock_cognito_service, db_session):
        """Test POST /api/v1/auth/forgot-password"""
        db_session.session.add(
            User(
                id="user-fp-1",
                cognito_id="cognito-fp-1",
                email="test@example.com",
                name="Forgot PW User",
            )
        )
        db_session.session.commit()
        mock_cognito_service.admin_get_user_status = Mock(
            return_value={
                "success": True,
                "user_status": "CONFIRMED",
                "email_verified": True,
            }
        )

        response = client.post("/api/v1/auth/forgot-password", json={"email": "test@example.com"})

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_reset_password_endpoint(self, client, mock_cognito_service):
        """Test POST /api/v1/auth/reset-password"""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": "test@example.com",
                "code": "123456",
                "new_password": "NewPassword123!",
            },
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_google_oauth_callback(self, client, mock_cognito_service):
        """Test GET /api/v1/auth/google/callback"""
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

                response = client.get(
                    "/api/v1/auth/google/callback?code=oauth_code&state=state_token"
                )

                # OAuth callback typically redirects
                assert response.status_code in [200, 302]

    def test_current_user_endpoint(self, client, db_session):
        """Test GET /api/v1/user/profile (current user)"""
        user = User(
            id="user-123",
            cognito_id="cognito-profile-1",
            email="test@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get:
            mock_get.return_value = user

            response = client.get(
                "/api/v1/user/profile",
                headers={"Authorization": "Bearer mock_access_token"},
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            profile = data.get("data", {})
            assert profile.get("id") == "user-123"
            assert profile.get("email") == "test@example.com"

    def test_missing_required_fields(self, client):
        """Invalid bodies are rejected by OpenAPI request validation before handlers run."""
        response = client.post("/api/v1/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None
        assert data.get("success") is not True
        assert isinstance(data.get("field_errors"), dict)
        assert data.get("validation_errors") is None

        response = client.post(
            "/api/v1/auth/signup",
            json={"password": "Password123!", "name": "New User"},
        )
        assert response.status_code == 400

    def test_forgot_password_unknown_user_enumeration_safe(self, client, mock_cognito_service):
        """Unknown email still returns generic success from the route handler."""
        with patch(
            "app.routes.auth.handlers.password.forgot.ensure_cognito_account_for_user",
            return_value=(None, "User not found", False),
        ):
            response = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "missing@example.com"},
            )

        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_reset_password_invalid_code(self, client, mock_cognito_service):
        """Invalid reset code returns validation error envelope."""
        mock_cognito_service.confirm_forgot_password.return_value = {
            "success": False,
            "error": "CodeMismatchException",
            "message": "Invalid verification code provided, please try again.",
        }

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": "test@example.com",
                "code": "999999",
                "new_password": "NewPassword123!",
            },
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert data.get("error_id")
        assert "invalid" in data["message"].lower()
