"""
Tests for authentication token refresh flow
"""

import uuid
from unittest.mock import Mock, patch

import jwt
from flask import Flask

from app import db
from app.models import User


class TestRefreshFlow:
    """Test token refresh flow"""

    def _seed_cognito_user(self, app: Flask) -> str:
        uid = str(uuid.uuid4())
        with app.app_context():
            user = User(
                id=uid,
                email="refresh-test@example.com",
                name="Refresh Test",
                cognito_id="cognito-sub-refresh",
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
        return uid

    def _cleanup_user(self, app: Flask, user_id: str) -> None:
        with app.app_context():
            row = db.session.get(User, user_id)
            if row is not None:
                db.session.delete(row)
                db.session.commit()

    def test_successful_token_refresh(self, app: Flask, mock_cognito_service):
        """Test successful token refresh"""
        from app.services.auth.flows import refresh as refresh_mod
        from app.services.auth.flows.refresh import handle_refresh_token

        user_id = self._seed_cognito_user(app)
        try:
            token = jwt.encode({"sub": user_id, "email": "refresh-test@example.com"}, "secret")
            with app.app_context():
                with patch.object(
                    refresh_mod.jwt,
                    "decode",
                    return_value={"sub": user_id, "email": "refresh-test@example.com"},
                ):
                    with patch(
                        "app.services.auth.utils.token_creation.create_minimal_tokens"
                    ) as mock_create_tokens:
                        mock_create_tokens.return_value = ("new_access_token", "new_id_token")
                        with app.test_request_context(
                            "/",
                            headers={"Cookie": f"session={token};refresh_token=mock_refresh_token"},
                        ):
                            response, status_code = handle_refresh_token("req-123")

                            assert status_code == 200
                            response_json = response.get_json()
                            assert response_json["success"] is True
                            assert "id_token" in response_json
                            assert "user" in response_json
                            mock_cognito_service.refresh_access_token.assert_called_once()
        finally:
            self._cleanup_user(app, user_id)

    def test_refresh_with_invalid_token(self, app: Flask, mock_cognito_service):
        """Test refresh with invalid refresh token"""
        from app.services.auth.flows import refresh as refresh_mod
        from app.services.auth.flows.refresh import handle_refresh_token

        user_id = self._seed_cognito_user(app)
        try:
            mock_cognito_service.refresh_access_token.return_value = {
                "success": False,
                "error": "NotAuthorizedException",
                "message": "Invalid refresh token",
            }
            token = jwt.encode({"sub": user_id, "email": "refresh-test@example.com"}, "secret")
            with app.app_context():
                with patch.object(
                    refresh_mod.jwt,
                    "decode",
                    return_value={"sub": user_id, "email": "refresh-test@example.com"},
                ):
                    with app.test_request_context(
                        "/",
                        headers={"Cookie": f"session={token};refresh_token=invalid_token"},
                    ):
                        response, status_code = handle_refresh_token("req-123")

                        assert status_code == 401
                        response_json = response.get_json()
                        assert response_json["success"] is False
                        assert "error" in response_json
        finally:
            self._cleanup_user(app, user_id)

    def test_refresh_with_expired_token(self, app: Flask, mock_cognito_service):
        """Test refresh with expired refresh token"""
        from app.services.auth.flows import refresh as refresh_mod
        from app.services.auth.flows.refresh import handle_refresh_token

        user_id = self._seed_cognito_user(app)
        try:
            mock_cognito_service.refresh_access_token.return_value = {
                "success": False,
                "error": "NotAuthorizedException",
                "message": "Refresh token has expired",
            }
            token = jwt.encode({"sub": user_id, "email": "refresh-test@example.com"}, "secret")
            with app.app_context():
                with patch.object(
                    refresh_mod.jwt,
                    "decode",
                    return_value={"sub": user_id, "email": "refresh-test@example.com"},
                ):
                    with app.test_request_context(
                        "/",
                        headers={"Cookie": f"session={token};refresh_token=expired_token"},
                    ):
                        response, status_code = handle_refresh_token("req-123")

                        assert status_code == 401
                        response_json = response.get_json()
                        assert response_json["success"] is False
                        assert "expired" in response_json["message"].lower()
        finally:
            self._cleanup_user(app, user_id)

    def test_refresh_updates_cookies(self, app: Flask, mock_cognito_service):
        """Test refresh updates auth cookies"""
        from app.services.auth.flows import refresh as refresh_mod
        from app.services.auth.flows.refresh import handle_refresh_token

        user_id = self._seed_cognito_user(app)
        try:
            token = jwt.encode({"sub": user_id, "email": "refresh-test@example.com"}, "secret")
            with app.app_context():
                with patch.object(
                    refresh_mod.jwt,
                    "decode",
                    return_value={"sub": user_id, "email": "refresh-test@example.com"},
                ):
                    with patch(
                        "app.services.auth.utils.token_creation.create_minimal_tokens"
                    ) as mock_create_tokens:
                        with patch(
                            "app.services.auth.flows.refresh_handlers.set_auth_cookies"
                        ) as mock_set_cookies:
                            mock_create_tokens.return_value = (
                                "new_access_token",
                                "new_id_token",
                            )
                            mock_set_cookies.return_value = Mock()

                            with app.test_request_context(
                                "/",
                                headers={
                                    "Cookie": f"session={token};refresh_token=mock_refresh_token"
                                },
                            ):
                                response, status_code = handle_refresh_token("req-123")

                                assert status_code == 200
                                mock_set_cookies.assert_called()
        finally:
            self._cleanup_user(app, user_id)


class TestRefreshHandlers:
    """Test refresh handler utilities"""

    def test_extract_refresh_token_from_cookie(self, app: Flask):
        """Test extracting refresh token from cookie"""
        from app.services.auth.flows.refresh_handlers import extract_refresh_token_from_cookie

        with app.test_request_context("/", headers={"Cookie": "refresh_token=test_token_123"}):
            token = extract_refresh_token_from_cookie()
            assert token == "test_token_123"

    def test_extract_refresh_token_missing(self, app: Flask):
        """Test extracting refresh token when missing"""
        from app.services.auth.flows.refresh_handlers import extract_refresh_token_from_cookie

        with app.test_request_context("/"):
            token = extract_refresh_token_from_cookie()
            assert token is None

    def test_validate_refresh_token_format(self, app: Flask):
        """Test refresh token format validation"""
        from app.services.auth.flows.refresh_handlers import validate_refresh_token

        with app.app_context():
            assert validate_refresh_token("valid_token_123") is True
            assert validate_refresh_token("") is False
            assert validate_refresh_token(None) is False
            assert validate_refresh_token("abc") is False
