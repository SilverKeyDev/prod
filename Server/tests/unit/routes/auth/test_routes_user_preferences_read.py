"""Tests for GET /api/v1/preferences."""

from unittest.mock import patch

from flask import Flask


class TestPreferencesRead:
    """Read user preferences."""

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

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=sample_preferences,
                )

                response = client.get(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "preferences" in data
                assert data["has_preferences"] is True
                assert data["preferences"].get("preferences_version") == "1.0"

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

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.get(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["has_preferences"] is True
                assert "preferences" in data
                assert data["preferences"]["name"] == "Test User"
