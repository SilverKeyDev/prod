"""
Tests for user preferences authorization and delete flows.
"""

from unittest.mock import patch

from flask import Flask


class TestPreferencesAuthAndDelete:
    def test_preferences_unauthorized(self, client):
        """Test preferences endpoints without auth"""
        # Test POST
        response = client.post("/api/v1/preferences", json={"price_min": 200000})
        assert response.status_code == 401

        # Test GET
        response = client.get("/api/v1/preferences")
        assert response.status_code == 401

        # Test DELETE
        response = client.delete("/api/v1/preferences")
        assert response.status_code == 401

    def test_delete_preferences_clears_current_user(
        self, client, app: Flask, db_session, sample_preferences
    ):
        """DELETE /api/v1/preferences removes preference rows for the authenticated user."""
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

            with (
                patch("app.services.auth.get_current_user") as mock_prefs_get,
                patch("app.services.auth.get_current_user") as mock_auth_get,
            ):
                mock_prefs_get.return_value = user
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
            from sqlalchemy import select

            from app.models import AgentConnections, User, UserFinancials, UserRole

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

            db_session.session.add(
                AgentConnections(agent_id=str(agent.id), client_id=str(client_user.id))
            )
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

            with (
                patch("app.services.auth.get_current_user") as mock_prefs_get,
                patch("app.services.auth.get_current_user") as mock_auth_get,
            ):
                mock_prefs_get.return_value = agent
                mock_auth_get.return_value = agent
                agent_post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=agent_prefs,
                )
                assert agent_post.status_code == 200

                mock_prefs_get.return_value = client_user
                mock_auth_get.return_value = client_user
                client_post = client.post(
                    "/api/v1/preferences",
                    headers={"Authorization": "Bearer mock_token"},
                    json=client_prefs,
                )
                assert client_post.status_code == 200

                mock_prefs_get.return_value = agent
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
