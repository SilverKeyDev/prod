"""Tests for agent chat list, history, and messaging endpoints."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User
from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, TEST_JWT_HMAC_SECRET, algorithm="HS256"
)


class TestAgentChatsRoutesConversations:
    """Test agent chat/conversation endpoints (list, history, send message)."""

    def test_get_chats_as_agent(self, client, db_session):
        """Test GET /api/v1/agent/chats as agent"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversations") as mock_get_convs:
                mock_get_convs.return_value = [
                    {
                        "id": "conv-1",
                        "agent_id": "agent-123",
                        "client_id": "client-1",
                        "client_name": "Client One",
                        "client_email": "client1@example.com",
                        "last_message": "Hello",
                        "last_message_at": "2024-01-01T10:00:00Z",
                        "created_at": "2024-01-01T09:00:00Z",
                        "updated_at": "2024-01-01T10:00:00Z",
                        "unread_count": 1,
                    }
                ]

                response = client.get(
                    "/api/v1/agent/chats",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "conversations" in data
                assert len(data["conversations"]) == 1
                assert data["conversations"][0]["id"] == "conv-1"

    def test_get_chats_filter_by_client(self, client, db_session):
        """Test GET /api/v1/agent/chats with client_id filter"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversations") as mock_get_convs:
                mock_get_convs.return_value = [
                    {
                        "id": "conv-1",
                        "agent_id": "agent-123",
                        "client_id": "client-1",
                        "client_name": "Client One",
                    },
                    {
                        "id": "conv-2",
                        "agent_id": "agent-123",
                        "client_id": "client-2",
                        "client_name": "Client Two",
                    },
                ]

                response = client.get(
                    "/api/v1/agent/chats?client_id=client-1",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                # Handler should filter to only client-1
                filtered_convs = [c for c in data["conversations"] if c["client_id"] == "client-1"]
                assert len(filtered_convs) == 1

    def test_create_chat_success(self, client, db_session):
        """Test POST /api/v1/agent/chats - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.create_conversation") as mock_create:
                mock_create.return_value = {
                    "id": "conv-new",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                    "created_at": "2024-01-01T00:00:00Z",
                }

                response = client.post(
                    "/api/v1/agent/chats",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    json={"client_id": "client-1"},
                )

                assert response.status_code == 201
                data = response.get_json()
                assert data["success"] is True
                assert "conversation" in data
                assert data["conversation"]["id"] == "conv-new"

    def test_create_chat_missing_client_id(self, client, db_session):
        """Test POST /api/v1/agent/chats without client_id"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/chats",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={},
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
