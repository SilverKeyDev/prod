"""Tests for user profile API routes."""

from io import BytesIO
from unittest.mock import Mock, patch

from flask import Flask


class TestUserProfile:
    """Test user profile endpoints"""

    def test_get_profile_authenticated(self, client, app: Flask, db_session):
        """Test GET /api/v1/user/profile with valid auth"""
        with app.app_context():
            from app.models import User

            # Create test user
            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                phone="+1234567890",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Mock authentication - patch where it's imported
            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/user/profile",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "data" in data
                assert data["data"]["email"] == "testuser@example.com"
                assert data["data"]["name"] == "Test User"
                assert data["data"]["phone"] == "+1234567890"

    def test_get_profile_unauthorized(self, client):
        """Test GET /api/v1/user/profile without auth token"""
        response = client.get("/api/v1/user/profile")
        assert response.status_code == 401

    def test_get_profile_invalid_token(self, client, app: Flask):
        """Test GET /api/v1/user/profile with invalid token"""
        with app.app_context():
            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                from app.services.auth import SecurityException

                mock_get.side_effect = SecurityException(("invalid_token", 401))

                response = client.get(
                    "/api/v1/user/profile",
                    headers={"Authorization": "Bearer invalid_token"},
                )

                assert response.status_code == 401

    def test_upload_profile_picture_success(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/profile-picture with valid image"""
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                with patch("app.services.documents.s3_service") as mock_s3:
                    mock_s3.s3_client = Mock()
                    mock_s3.upload_file = Mock(return_value="profile_pictures/test-123/avatar.jpg")
                    mock_s3.generate_view_url = Mock(
                        return_value="https://example.com/presigned-url"
                    )

                    # Mock file validation to bypass MIME type check
                    with patch(
                        "app.utils.security.file_security.validate_file_upload"
                    ) as mock_validate:
                        mock_validate.return_value = ("test.jpg", "image/jpeg")

                        # Create a mock image file
                        file_data = b"fake image data"
                        file = (BytesIO(file_data), "test.jpg")

                        response = client.post(
                            "/api/v1/user/profile-picture",
                            headers={"Authorization": "Bearer mock_token"},
                            data={"file": file},
                            content_type="multipart/form-data",
                        )

                        assert response.status_code == 201
                        data = response.get_json()
                        assert data["success"] is True
                        assert "profile_picture_url" in data

    def test_upload_profile_picture_presign_failure_returns_503(
        self, client, app: Flask, db_session
    ):
        """Presign failure must not return 201 success with a null URL (client cannot show avatar)."""
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                with patch("app.services.documents.s3_service") as mock_s3:
                    mock_s3.s3_client = Mock()
                    mock_s3.upload_file = Mock(return_value="profile_pictures/test-123/avatar.jpg")
                    mock_s3.generate_view_url = Mock(return_value=None)
                    mock_s3.delete_pdf = Mock(return_value=True)

                    with patch(
                        "app.utils.security.file_security.validate_file_upload"
                    ) as mock_validate:
                        mock_validate.return_value = ("test.jpg", "image/jpeg")

                        file_data = b"fake image data"
                        file = (BytesIO(file_data), "test.jpg")

                        response = client.post(
                            "/api/v1/user/profile-picture",
                            headers={"Authorization": "Bearer mock_token"},
                            data={"file": file},
                            content_type="multipart/form-data",
                        )

                        assert response.status_code == 503
                        mock_s3.delete_pdf.assert_called_once_with(
                            "profile_pictures/test-123/avatar.jpg"
                        )

    def test_upload_profile_picture_no_file(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/profile-picture without file"""
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/user/profile-picture",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 400

    def test_upload_profile_picture_unauthorized(self, client):
        """Test POST /api/v1/user/profile-picture without auth"""
        response = client.post("/api/v1/user/profile-picture")
        assert response.status_code == 401
