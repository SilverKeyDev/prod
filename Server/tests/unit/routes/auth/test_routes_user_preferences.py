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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
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

    def test_create_preferences_syncs_seller_roles_to_profile(self, client, app: Flask, db_session):
        """POST preferences with seller why_join → GET profile includes seller (+ buyer) roles."""
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-seller",
                email="seller@example.com",
                name="Seller User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            seller_prefs = {
                "is_agent": "no",
                "why_joining_silverkey": ["buying_house", "selling_house"],
            }

            with patch(
                "app.routes.auth.handlers.preferences.preferences_preferences.get_current_user"
            ) as mock_get:
                mock_get.return_value = user

                post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=seller_prefs,
                )
                assert post.status_code == 200

                db_session.session.refresh(user)

                with patch("app.services.auth.get_current_user") as mock_profile:
                    mock_profile.return_value = user
                    profile = client.get(
                        "/api/v1/user/profile",
                        headers={"Authorization": "Bearer mock_token"},
                    )

            assert profile.status_code == 200
            body = profile.get_json()
            inner = body.get("data") or body.get("user") or body
            roles = inner.get("roles") or []
            assert "seller" in roles
            assert "buyer" in roles
