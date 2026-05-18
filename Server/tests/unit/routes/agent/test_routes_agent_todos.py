"""Tests for agent API routes - todos."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User

# Create a properly formatted mock JWT token for testing
MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
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

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = agent

            with patch("app.routes.agent.handlers.todos.delete_todo") as mock_delete:
                mock_delete.side_effect = ValueError("Todo not found")

                response = client.delete(
                    "/api/v1/agent/todos/nonexistent",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

                assert response.status_code == 400
