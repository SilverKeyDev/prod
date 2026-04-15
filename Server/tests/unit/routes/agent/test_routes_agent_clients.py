"""Tests for agent API routes - clients."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User

# Create a properly formatted mock JWT token for testing
MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


class TestAgentClientsRoutes:
    """Test agent clients endpoints"""

    def test_get_clients_success(self, client, db_session):
        """Test GET /api/v1/agent/clients - happy path"""
        # Create agent user
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)

        # Create client users
        client1 = User(
            id="client-1",
            cognito_id="cognito-client-1",
            email="client1@example.com",
            name="Client One",
            is_agent=False,
        )
        client2 = User(
            id="client-2",
            cognito_id="cognito-client-2",
            email="client2@example.com",
            name="Client Two",
            is_agent=False,
        )
        db_session.session.add_all([client1, client2])
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.clients.get_agent_clients") as mock_get_clients:
                mock_get_clients.return_value = [
                    {
                        "id": "client-1",
                        "name": "Client One",
                        "email": "client1@example.com",
                        "phone": "+1234567890",
                        "profile_picture": None,
                        "created_at": "2024-01-01T00:00:00Z",
                    },
                    {
                        "id": "client-2",
                        "name": "Client Two",
                        "email": "client2@example.com",
                        "phone": None,
                        "profile_picture": None,
                        "created_at": "2024-01-02T00:00:00Z",
                    },
                ]

                response = client.get(
                    "/api/v1/agent/clients",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "clients" in data
                assert len(data["clients"]) == 2
                assert data["clients"][0]["id"] == "client-1"
                assert data["clients"][1]["id"] == "client-2"

    def test_get_clients_unauthorized_no_token(self, client):
        """Test GET /api/v1/agent/clients without auth token"""
        response = client.get("/api/v1/agent/clients")
        assert response.status_code == 401

    def test_get_clients_non_agent_access(self, client, db_session):
        """Test GET /api/v1/agent/clients with non-agent user"""
        non_agent = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Regular User",
            is_agent=False,
        )
        db_session.session.add(non_agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = non_agent

            response = client.get(
                "/api/v1/agent/clients",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )

            # require_agent_access should reject non-agents
            assert response.status_code in [401, 403]
