"""Tests for favorite homes API routes."""

import uuid
from unittest.mock import patch

from flask import Flask


def _property_and_link(db_session, user_id: str, *, address: str, liked: bool = True):
    """Create a ``PropertyCache`` row and a ``UserPropertyLink`` (favorites API source)."""
    from app.models import PropertyCache, UserPropertyLink

    suffix = uuid.uuid4().hex[:10]
    prop = PropertyCache(
        id=str(uuid.uuid4()),
        zpid=f"zpid-{suffix}",
        address=address,
        address_normalized=f"{address.lower().replace(' ', '_')}_{suffix}",
        price="350000",
        beds="3",
        baths="2",
        sqft="2000",
        primary_image_url="https://example.com/img.jpg",
    )
    db_session.session.add(prop)
    db_session.session.flush()
    link = UserPropertyLink(
        user_id=str(user_id),
        property_id=prop.id,
        is_liked=liked,
        current=True,
    )
    db_session.session.add(link)
    return prop, link


class TestFavoriteHomes:
    """Test favorite homes endpoints"""

    def test_get_favorite_homes_authenticated(self, client, app: Flask, db_session):
        """Test GET /api/v1/user/favorite-homes"""
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

            _property_and_link(db_session, user.id, address="123 Main St")
            _property_and_link(db_session, user.id, address="456 Oak Ave")
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
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            for i in range(25):
                _property_and_link(db_session, user.id, address=f"{i + 1} Test St")
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
            from app.models import User

            user = User(
                cognito_id="test-cognito-123",
                email="testuser@example.com",
                name="Test User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            _property_and_link(db_session, user.id, address="123 Main St")
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
