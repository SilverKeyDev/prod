"""Tests for agent chat mark-read endpoints."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


class TestAgentChatsRoutesMarkRead:
    """Test POST /api/v1/agent/chats/<id>/read."""

    def test_mark_chat_as_read_success(self, client, db_session):
        """Test POST /api/v1/agent/chats/<id>/read - happy path"""
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

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                with patch("app.routes.agent.handlers.chats.mark_messages_as_read") as mock_mark:
                    mock_mark.return_value = {"messages_marked": 5}

                    response = client.post(
                        "/api/v1/agent/chats/conv-1/read",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data["success"] is True
                    assert data["messages_marked"] == 5

    def test_mark_chat_as_read_not_found(self, client, db_session):
        """Test POST /api/v1/agent/chats/<id>/read with non-existent conversation"""
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

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = None

                response = client.post(
                    "/api/v1/agent/chats/nonexistent/read",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 404

    def test_mark_chat_as_read_access_denied(self, client, db_session):
        """Test POST /api/v1/agent/chats/<id>/read with unauthorized user"""
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

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "different-agent",
                    "client_id": "different-client",
                }

                response = client.post(
                    "/api/v1/agent/chats/conv-1/read",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 403
