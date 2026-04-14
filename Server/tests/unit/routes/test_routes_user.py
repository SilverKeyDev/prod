"""
Tests for user and preferences routes

Tests:
- GET /api/v1/user/profile
- PUT /api/v1/user/profile
- POST /api/v1/user/profile-picture
- GET /api/v1/user/favorite-homes
- POST /api/v1/user/favorite-homes/add
- POST /api/v1/user/favorite-homes/remove
- GET /api/v1/user/not-interested-homes
- POST /api/v1/user/not-interested-homes/add
- POST /api/v1/preferences
- GET /api/v1/preferences
"""

from datetime import datetime, timezone
from io import BytesIO
from unittest.mock import Mock, patch

import pytest
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
                    mock_s3.generate_view_url = Mock(return_value="https://example.com/presigned-url")

                    # Mock file validation to bypass MIME type check
                    with patch("app.utils.security.file_security.validate_file_upload") as mock_validate:
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


class TestFavoriteHomes:
    """Test favorite homes endpoints"""

    def test_get_favorite_homes_authenticated(self, client, app: Flask, db_session):
        """Test GET /api/v1/user/favorite-homes"""
        with app.app_context():
            from app.models import HomeUniversal, User

            # Create test user
            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create test homes with timezone-aware timestamps
            now = datetime.now(timezone.utc)
            home1 = HomeUniversal(
                user_id=str(user.id),
                address="123 Main St",
                is_liked=True,
                current=True,
                price=350000,
                beds=3,
                baths=2,
                created_at=now,
                updated_at=now,
            )
            home2 = HomeUniversal(
                user_id=str(user.id),
                address="456 Oak Ave",
                is_liked=True,
                current=True,
                price=425000,
                beds=4,
                baths=2.5,
                created_at=now,
                updated_at=now,
            )
            db_session.session.add(home1)
            db_session.session.add(home2)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/user/favorite-homes",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "favorites" in data
                assert len(data["favorites"]) == 2
                assert "pagination" in data

    def test_get_favorite_homes_pagination(self, client, app: Flask, db_session):
        """Test GET /api/v1/user/favorite-homes with pagination"""
        with app.app_context():
            from app.models import HomeUniversal, User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create 25 test homes with timezone-aware timestamps
            now = datetime.now(timezone.utc)
            for i in range(25):
                home = HomeUniversal(
                    user_id=str(user.id),
                    address=f"{i+1} Test St",
                    is_liked=True,
                    current=True,
                    price=300000 + (i * 10000),
                    beds=3,
                    baths=2,
                    created_at=now,
                    updated_at=now,
                )
                db_session.session.add(home)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/user/favorite-homes?page=1&per_page=10",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert len(data["favorites"]) == 10
                assert data["pagination"]["favorites"]["total"] == 25
                assert data["pagination"]["favorites"]["page"] == 1
                assert data["pagination"]["favorites"]["per_page"] == 10

    def test_add_favorite_home(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/favorite-homes/add"""
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

                home_data = {
                    "home": {
                        "address": "789 Pine Rd",
                        "price": 450000,
                        "beds": 4,
                        "baths": 3,
                        "sqft": 2500,
                        "image_url": "https://example.com/image.jpg",  # Add valid image_url
                    }
                }

                response = client.post(
                    "/api/v1/user/favorite-homes/add",
                    headers={"Authorization": "Bearer mock_token"},
                    json=home_data,
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "favorites" in data
                assert data["message"] == "Home added to favorites"

    def test_add_favorite_home_missing_address(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/favorite-homes/add without address"""
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

                home_data = {"home": {"price": 450000, "beds": 4}}

                response = client.post(
                    "/api/v1/user/favorite-homes/add",
                    headers={"Authorization": "Bearer mock_token"},
                    json=home_data,
                )

                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False
                assert "address" in data["error"].lower()

    def test_remove_favorite_home(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/favorite-homes/remove"""
        with app.app_context():
            from app.models import HomeUniversal, User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create a liked home with timezone-aware timestamps
            now = datetime.now(timezone.utc)
            home = HomeUniversal(
                user_id=str(user.id),
                address="123 Main St",
                is_liked=True,
                current=True,
                price=350000,
                beds=3,
                baths=2,
                created_at=now,
                updated_at=now,
            )
            db_session.session.add(home)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/user/favorite-homes/remove",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"address": "123 Main St"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["message"] == "Home unliked"

    def test_remove_favorite_home_not_found(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/favorite-homes/remove for non-existent home"""
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
                    "/api/v1/user/favorite-homes/remove",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"address": "999 Nonexistent St"},
                )

                assert response.status_code == 404
                data = response.get_json()
                assert data["success"] is False

    def test_get_favorite_homes_unauthorized(self, client):
        """Test GET /api/v1/user/favorite-homes without auth"""
        response = client.get("/api/v1/user/favorite-homes")
        assert response.status_code == 401


class TestNotInterestedHomes:
    """Test not-interested homes endpoints"""

    def test_get_not_interested_homes(self, client, app: Flask, db_session):
        """Test GET /api/v1/user/not-interested-homes"""
        with app.app_context():
            from app.models import HomeNotInterested, User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create not-interested homes
            home1 = HomeNotInterested(
                user_id=str(user.id),
                address="100 Reject St",
                is_not_interested=True,
                why="Too far from work",
            )
            home2 = HomeNotInterested(
                user_id=str(user.id),
                address="200 Nope Ave",
                is_not_interested=True,
                why="Too expensive",
            )
            db_session.session.add(home1)
            db_session.session.add(home2)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/user/not-interested-homes",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "notInterested" in data
                assert len(data["notInterested"]) == 2

    def test_add_not_interested_home(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/not-interested-homes/add"""
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

                home_data = {
                    "home": {
                        "address": "300 Reject Rd",
                        "price": 600000,
                        "beds": 2,
                        "baths": 1,
                    },
                    "why": "Too small for family",
                }

                response = client.post(
                    "/api/v1/user/not-interested-homes/add",
                    headers={"Authorization": "Bearer mock_token"},
                    json=home_data,
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "notInterested" in data
                assert data["message"] == "Home marked as not interested"

    def test_add_not_interested_home_missing_address(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/not-interested-homes/add without address"""
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

                home_data = {"home": {"price": 600000}, "why": "Too expensive"}

                response = client.post(
                    "/api/v1/user/not-interested-homes/add",
                    headers={"Authorization": "Bearer mock_token"},
                    json=home_data,
                )

                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False
                assert "address" in data["error"].lower()

    def test_remove_not_interested_home(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/not-interested-homes/remove"""
        with app.app_context():
            from app.models import HomeNotInterested, User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create not-interested home
            home = HomeNotInterested(
                user_id=str(user.id),
                address="100 Reject St",
                is_not_interested=True,
                why="Changed mind",
            )
            db_session.session.add(home)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/user/not-interested-homes/remove",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"address": "100 Reject St"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["message"] == "Home removed from not-interested list"

    def test_update_not_interested_home(self, client, app: Flask, db_session):
        """Test POST /api/v1/user/not-interested-homes/update"""
        with app.app_context():
            from app.models import HomeNotInterested, User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            # Create not-interested home
            home = HomeNotInterested(
                user_id=str(user.id),
                address="100 Reject St",
                is_not_interested=True,
                why="Original reason",
            )
            db_session.session.add(home)
            db_session.session.commit()

            with patch("app.utils.common_patterns.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/user/not-interested-homes/update",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"address": "100 Reject St", "why": "Updated reason"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["message"] == "Not-interested reason updated"

    def test_get_not_interested_homes_unauthorized(self, client):
        """Test GET /api/v1/user/not-interested-homes without auth"""
        response = client.get("/api/v1/user/not-interested-homes")
        assert response.status_code == 401


class TestPreferences:
    """Test user preferences endpoints"""

    def test_create_preferences(self, client, app: Flask, db_session, sample_preferences):
        """Test POST /api/v1/preferences"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=sample_preferences,
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "preferences" in data
                assert data["message"] == "Preferences saved successfully"

    def test_create_preferences_partial_data(self, client, app: Flask, db_session):
        """Test POST /api/v1/preferences with partial data"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                partial_prefs = {
                    "price_min": 250000,
                    "price_max": 500000,
                    "preferred_bedrooms": 3,
                }

                response = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=partial_prefs,
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_get_preferences(self, client, app: Flask, db_session, sample_preferences):
        """Test GET /api/v1/preferences"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                # First create preferences
                client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=sample_preferences,
                )

                # Then get them
                response = client.get(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "preferences" in data
                assert data["has_preferences"] is True

    def test_get_preferences_none_set(self, client, app: Flask, db_session):
        """Test GET /api/v1/preferences when no explicit preferences exist (returns user defaults)"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                # has_preferences is True because the function returns user defaults (name, is_agent)
                assert data["has_preferences"] is True
                assert "preferences" in data
                # Should have at least user defaults
                assert data["preferences"]["name"] == "Test User"

    def test_update_preferences(self, client, app: Flask, db_session, sample_preferences):
        """Test POST /api/v1/preferences updates existing preferences"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                # Create initial preferences
                client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=sample_preferences,
                )

                # Update preferences
                updated_prefs = {
                    "price_min": 300000,
                    "price_max": 600000,
                    "preferred_bedrooms": 4,
                }

                response = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=updated_prefs,
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_create_preferences_no_data(self, client, app: Flask, db_session):
        """Test POST /api/v1/preferences without JSON body - accepts empty preferences"""
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

            with patch("app.routes.auth.handlers.preferences_preferences.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json={},  # Send empty JSON object
                )

                # CreatePreferencesRequest has no required fields, so empty request is valid
                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_preferences_unauthorized(self, client):
        """Test preferences endpoints without auth"""
        # Test POST
        response = client.post("/api/v1/preferences", json={"price_min": 200000})
        assert response.status_code == 401

        # Test GET
        response = client.get("/api/v1/preferences")
        assert response.status_code == 401
