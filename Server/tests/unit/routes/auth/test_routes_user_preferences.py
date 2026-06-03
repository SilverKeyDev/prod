"""Tests for /api/v1/preferences endpoints (POST/GET/DELETE)."""

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

            with patch("app.services.auth.get_current_user") as mock_get:
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
                db_session.session.refresh(user)
                assert user.preferences_version == "1.0"
                assert data["preferences"].get("preferences_version") == "1.0"

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

            with patch("app.services.auth.get_current_user") as mock_get:
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
                db_session.session.refresh(user)
                assert user.preferences_version == "1.0"

    def test_create_preferences_respects_explicit_version(self, client, app: Flask, db_session):
        with app.app_context():
            from app.models import User

            user = User(
                cognito_id="test-cognito-version",
                email="versionuser@example.com",
                name="Version User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_get:
                mock_get.return_value = user

                response = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"preferences_version": "2.3", "home_budget_min": 100000},
                )

                assert response.status_code == 200
                db_session.session.refresh(user)
                assert user.preferences_version == "2.3"

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
                # has_preferences is True because the function returns user defaults (name, roles)
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

            with patch("app.services.auth.get_current_user") as mock_get:
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

            with patch("app.services.auth.get_current_user") as mock_get:
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
                "why_joining_silverkey": ["buying_house", "selling_house"],
            }

            with patch("app.services.auth.get_current_user") as mock_get:
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

    def test_preferences_unauthorized(self, client):
        """Test preferences endpoints without auth."""
        response = client.post("/api/v1/preferences", json={"price_min": 200000})
        assert response.status_code == 401

        response = client.get("/api/v1/preferences")
        assert response.status_code == 401

        response = client.delete("/api/v1/preferences")
        assert response.status_code == 401

    def test_delete_preferences_clears_current_user(
        self, client, app: Flask, db_session, sample_preferences
    ):
        """DELETE /api/v1/preferences removes preference rows for authenticated user."""
        with app.app_context():
            from sqlalchemy import func, select

            from app.models import User, UserFinancials

            user = User(
                cognito_id="test-cognito-del",
                email="deluser@example.com",
                name="Delete User",
                is_active=True,
            )
            db_session.session.add(user)
            db_session.session.commit()

            with patch("app.services.auth.get_current_user") as mock_auth_get:
                mock_auth_get.return_value = user

                post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=sample_preferences,
                )
                assert post.status_code == 200
                db_session.session.refresh(user)
                assert user.has_preferences is True

                response = client.delete(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["has_preferences"] is False
                assert data["preferences"] is None

                db_session.session.refresh(user)
                assert user.has_preferences is False
                assert user.preferences_version is None
                assert (
                    db_session.session.scalar(
                        select(func.count())
                        .select_from(UserFinancials)
                        .where(UserFinancials.user_id == str(user.id))
                    )
                    == 0
                )

    def test_delete_preferences_does_not_clear_client_rows(
        self, client, app: Flask, db_session, sample_preferences
    ):
        """Agent DELETE clears only the agent row; client preference rows remain."""
        with app.app_context():
            import json as json_mod

            from sqlalchemy import select

            from app.models import User, UserFinancials, UserRole

            agent = User(
                cognito_id="agent-cognito-del",
                email="agent-del@example.com",
                name="Agent Delete",
                is_active=True,
            )
            client_user = User(
                cognito_id="client-cognito-del",
                email="client-del@example.com",
                name="Client Delete",
                is_active=True,
            )
            db_session.session.add(agent)
            db_session.session.add(UserRole(user_id=agent.id, role="agent"))
            db_session.session.add(client_user)
            db_session.session.commit()

            agent.client_ids = json_mod.dumps([str(client_user.id)])
            db_session.session.add(agent)
            db_session.session.commit()

            client_prefs = {
                **sample_preferences,
                "home_budget_min": 111000,
                "home_budget_max": 222000,
            }
            agent_prefs = {
                **sample_preferences,
                "home_budget_min": 333000,
                "home_budget_max": 444000,
            }

            with patch("app.services.auth.get_current_user") as mock_auth_get:
                mock_auth_get.return_value = agent
                agent_post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=agent_prefs,
                )
                assert agent_post.status_code == 200

                mock_auth_get.return_value = client_user
                client_post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=client_prefs,
                )
                assert client_post.status_code == 200

                mock_auth_get.return_value = agent
                response = client.delete(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                )
                assert response.status_code == 200

                agent_fin = db_session.session.scalar(
                    select(UserFinancials).where(UserFinancials.user_id == str(agent.id))
                )
                client_fin = db_session.session.scalar(
                    select(UserFinancials).where(UserFinancials.user_id == str(client_user.id))
                )
                assert agent_fin is None
                assert client_fin is not None
                assert client_fin.home_budget_min == 111000
