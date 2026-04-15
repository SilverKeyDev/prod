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

from unittest.mock import patch

from flask import Flask


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
