"""Tests for favorite homes API routes."""

from datetime import datetime, timezone
from unittest.mock import patch

from flask import Flask


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
                    address=f"{i + 1} Test St",
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
