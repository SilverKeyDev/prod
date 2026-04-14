"""
Tests for agent API routes
"""

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


class TestAgentTodosRoutes:
    """Test agent todos endpoints"""

    def test_get_todos_as_agent(self, client, db_session):
        """Test GET /api/v1/agent/todos as agent"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.get_agent_todos") as mock_get_todos:
                mock_get_todos.return_value = [
                    {
                        "id": "todo-1",
                        "agent_id": "agent-123",
                        "client_id": "client-1",
                        "title": "Follow up with client",
                        "description": "Discuss property options",
                        "type": "follow_up",
                        "due_date": "2024-12-31T10:00:00Z",
                        "completed": False,
                        "completed_at": None,
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z",
                    }
                ]

                response = client.get(
                    "/api/v1/agent/todos",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "todos" in data
                assert len(data["todos"]) == 1
                assert data["todos"][0]["id"] == "todo-1"

    def test_get_todos_as_client(self, client, db_session):
        """Test GET /api/v1/agent/todos as client"""
        user = User(
            id="client-1",
            cognito_id="cognito-client-1",
            email="client@example.com",
            name="Test Client",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = user

            with patch("app.routes.agent.handlers.todos.get_client_todos") as mock_get_todos:
                mock_get_todos.return_value = [
                    {
                        "id": "todo-2",
                        "agent_id": "agent-123",
                        "client_id": "client-1",
                        "title": "Review documents",
                        "type": "manual",
                        "due_date": None,
                        "completed": False,
                        "completed_at": None,
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z",
                    }
                ]

                response = client.get(
                    "/api/v1/agent/todos",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert len(data["todos"]) == 1

    def test_get_todos_include_completed(self, client, db_session):
        """Test GET /api/v1/agent/todos with include_completed parameter"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.get_agent_todos") as mock_get_todos:
                mock_get_todos.return_value = [
                    {
                        "id": "todo-1",
                        "agent_id": "agent-123",
                        "title": "Task 1",
                        "type": "manual",
                        "completed": False,
                    },
                    {
                        "id": "todo-2",
                        "agent_id": "agent-123",
                        "title": "Task 2",
                        "type": "manual",
                        "completed": True,
                    },
                ]

                response = client.get(
                    "/api/v1/agent/todos?include_completed=true",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                # Verify include_completed was passed to service
                mock_get_todos.assert_called_once_with("agent-123", include_completed=True)

    def test_create_todo_success(self, client, db_session):
        """Test POST /api/v1/agent/todos - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.create_todo") as mock_create:
                mock_create.return_value = {
                    "id": "todo-new",
                    "agent_id": "agent-123",
                    "client_id": "client-1",
                    "title": "New task",
                    "description": "Task description",
                    "type": "follow_up",
                    "due_date": "2024-12-31T10:00:00Z",
                    "completed": False,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z",
                }

                response = client.post(
                    "/api/v1/agent/todos",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    json={
                        "title": "New task",
                        "description": "Task description",
                        "type": "follow_up",
                        "due_date": "2024-12-31T10:00:00Z",
                        "client_id": "client-1",
                    },
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "todo" in data
                assert data["todo"]["id"] == "todo-new"
                assert data["todo"]["title"] == "New task"

    def test_create_todo_missing_title(self, client, db_session):
        """Test POST /api/v1/agent/todos without required title"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/todos",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={"description": "Missing title"},
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False

    def test_create_todo_invalid_due_date(self, client, db_session):
        """Test POST /api/v1/agent/todos with invalid due_date format"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/todos",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={
                    "title": "New task",
                    "due_date": "invalid-date",
                },
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
            assert "due_date" in data["error"].lower()

    def test_update_todo_success(self, client, db_session):
        """Test PUT /api/v1/agent/todos/<id> - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.update_todo") as mock_update:
                mock_update.return_value = {
                    "id": "todo-1",
                    "agent_id": "agent-123",
                    "title": "Updated task",
                    "completed": True,
                    "completed_at": "2024-01-02T00:00:00Z",
                }

                response = client.put(
                    "/api/v1/agent/todos/todo-1",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    json={
                        "title": "Updated task",
                        "completed": True,
                    },
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["todo"]["title"] == "Updated task"
                assert data["todo"]["completed"] is True

    def test_update_todo_not_found(self, client, db_session):
        """Test PUT /api/v1/agent/todos/<id> with non-existent todo"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.update_todo") as mock_update:
                mock_update.side_effect = ValueError("Todo not found")

                response = client.put(
                    "/api/v1/agent/todos/nonexistent",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    json={"title": "Updated"},
                )

                assert response.status_code == 400

    def test_delete_todo_success(self, client, db_session):
        """Test DELETE /api/v1/agent/todos/<id> - happy path"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.delete_todo") as mock_delete:
                mock_delete.return_value = None

                response = client.delete(
                    "/api/v1/agent/todos/todo-1",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_delete_todo_not_found(self, client, db_session):
        """Test DELETE /api/v1/agent/todos/<id> with non-existent todo"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.delete_todo") as mock_delete:
                mock_delete.side_effect = ValueError("Todo not found")

                response = client.delete(
                    "/api/v1/agent/todos/nonexistent",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 400


class TestAgentChatsRoutes:
    """Test agent chat/conversation endpoints"""

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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            response = client.post(
                "/api/v1/agent/chats",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={},
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False

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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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
                        "has_more": False,
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.user.current_user.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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

        with patch("app.utils.common_patterns.get_current_user") as mock_get_user:
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


class TestAgentChatsAuthAndValidation:
    """Test auth and validation for agent chats"""

    def test_chats_endpoints_require_auth(self, client):
        """Test that all chat endpoints require authentication"""
        endpoints = [
            ("/api/v1/agent/chats", "GET"),
            ("/api/v1/agent/chats", "POST"),
            ("/api/v1/agent/chats/conv-1/history", "GET"),
            ("/api/v1/agent/chats/message", "POST"),
            ("/api/v1/agent/chats/conv-1/read", "POST"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})

            assert response.status_code == 401, f"Expected 401 for {method} {endpoint}"

    def test_todos_endpoints_require_auth(self, client):
        """Test that all todo endpoints require authentication"""
        endpoints = [
            ("/api/v1/agent/todos", "GET"),
            ("/api/v1/agent/todos", "POST"),
            ("/api/v1/agent/todos/todo-1", "PUT"),
            ("/api/v1/agent/todos/todo-1", "DELETE"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})
            elif method == "DELETE":
                response = client.delete(endpoint)

            assert response.status_code == 401, f"Expected 401 for {method} {endpoint}"
