"""Tests for agent chat history and messaging endpoints."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


class TestAgentChatsRoutesHistoryAndMessages:
    """GET history and POST message endpoints."""

    def test_get_chat_history_success(self, client, db_session):
        """Test GET /api/v1/agent/chats/<id>/history - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                with patch(
                    "app.routes.agent.handlers.chats.get_conversation_history"
                ) as mock_get_history:
                    mock_get_history.return_value = {
                        "messages": [
                            {
                                "id": "msg-1",
                                "conversation_id": "conv-1",
                                "sender_id": "agent-123",
                                "message": "Hello",
                                "role": "agent",
                                "created_at": "2024-01-01T10:00:00Z",
                            }
                        ],
                        "has_more_older": False,
                        "has_more_newer": False,
                    }

                    response = client.get(
                        "/api/v1/agent/chats/conv-1/history",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data["success"] is True
                    assert "messages" in data
                    assert len(data["messages"]) == 1
                    mock_get_history.assert_called_once()
                    call_kw = mock_get_history.call_args.kwargs
                    assert call_kw.get("limit") is None
                    assert call_kw.get("before_timestamp") is None

    def test_get_chat_history_forwards_pagination_params(self, client, db_session):
        """GET history passes limit and before_* to get_conversation_history."""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                with patch(
                    "app.routes.agent.handlers.chats.get_conversation_history"
                ) as mock_get_history:
                    mock_get_history.return_value = {
                        "messages": [],
                        "has_more_older": False,
                        "has_more_newer": False,
                    }

                    response = client.get(
                        "/api/v1/agent/chats/conv-1/history?limit=10"
                        "&before_timestamp=2024-01-01T10:00:00Z&before_message_id=msg-old",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    )

                    assert response.status_code == 200
                    mock_get_history.assert_called_once()
                    kwargs = mock_get_history.call_args.kwargs
                    assert kwargs["limit"] == 10
                    assert kwargs["before_message_id"] == "msg-old"
                    assert kwargs["before_timestamp"] is not None

    def test_get_chat_history_invalid_timestamp(self, client, db_session):
        """GET history returns 400 for malformed before_timestamp."""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                response = client.get(
                    "/api/v1/agent/chats/conv-1/history?before_timestamp=not-a-date"
                    "&before_message_id=msg-1",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False

    def test_get_chat_history_not_found(self, client, db_session):
        """Test GET /api/v1/agent/chats/<id>/history with non-existent conversation"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = None

                response = client.get(
                    "/api/v1/agent/chats/nonexistent/history",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 404

    def test_get_chat_history_access_denied(self, client, db_session):
        """Test GET /api/v1/agent/chats/<id>/history with unauthorized user"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                # Conversation belongs to different agent/client
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "different-agent",
                    "client_id": "different-client",
                }

                response = client.get(
                    "/api/v1/agent/chats/conv-1/history",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 403

    def test_send_message_success(self, client, db_session):
        """Test POST /api/v1/agent/chats/message - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                with patch(
                    "app.routes.agent.handlers.chats.send_conversation_message"
                ) as mock_send:
                    mock_send.return_value = {"message_id": "msg-new"}

                    response = client.post(
                        "/api/v1/agent/chats/message",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                        json={
                            "conversation_id": "conv-1",
                            "message": "Hello client",
                        },
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data["success"] is True
                    assert data["message_id"] == "msg-new"

    def test_send_message_missing_conversation_id(self, client, db_session):
        """Test POST /api/v1/agent/chats/message without conversation_id"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/chats/message",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={"message": "Hello"},
            )

            assert response.status_code == 400

    def test_send_message_empty_message(self, client, db_session):
        """Test POST /api/v1/agent/chats/message with empty message and no attachment"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/chats/message",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={
                    "conversation_id": "conv-1",
                    "message": "   ",  # Empty/whitespace only
                },
            )

            assert response.status_code == 400
            data = response.get_json()
            assert "empty" in data["error"].lower()

    def test_send_message_with_attachment(self, client, db_session):
        """Test POST /api/v1/agent/chats/message with home attachment"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.chats.get_conversation") as mock_get_conv:
                mock_get_conv.return_value = {
                    "id": "conv-1",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                }

                with patch(
                    "app.routes.agent.handlers.chats.send_conversation_message"
                ) as mock_send:
                    mock_send.return_value = {"message_id": "msg-new"}

                    response = client.post(
                        "/api/v1/agent/chats/message",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                        json={
                            "conversation_id": "conv-1",
                            "message": "Check out this property",
                            "shared_home_id": "home-123",
                        },
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data["success"] is True
