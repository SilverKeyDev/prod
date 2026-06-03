"""Error envelope and status classification for agent route handlers (shard 3)."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User, UserRole
from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, TEST_JWT_HMAC_SECRET, algorithm="HS256"
)


def _assert_error_envelope(data: dict, *, status_code: int, response) -> None:
    assert response.status_code == status_code
    assert data["success"] is False
    assert data.get("error")
    assert data.get("message") is not None


class TestAgentConnectionRequestErrors:
    def test_invalid_scope_returns_400(self, client, db_session):
        user = User(
            id="client-1",
            cognito_id="cognito-1",
            email="client@example.com",
            name="Client",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user", return_value=user):
            response = client.get(
                "/api/v1/agent/connection-requests?scope=invalid",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=400, response=response)
        assert data["error"] == "INVALID_REQUEST"

    def test_forbidden_when_agent_requests_for_other_agent(self, client, db_session):
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent",
            email="agent@example.com",
            name="Agent",
        )
        db_session.session.add(agent)
        db_session.session.add(UserRole(user_id=agent.id, role="agent"))
        db_session.session.commit()

        with patch("app.services.auth.get_current_user", return_value=agent):
            response = client.post(
                "/api/v1/agent/connection-requests",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={"agent_id": "other-agent", "client_id": "client-1"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=403, response=response)
        assert data["error"] == "FORBIDDEN"


class TestAgentSearchAndNotificationErrors:
    def test_notification_counter_requires_session(self, client):
        with patch("app.services.auth.get_current_user", return_value=None):
            response = client.get("/api/v1/agent/notification-counter")

        assert response.status_code == 401
        data = response.get_json()
        assert data["success"] is False

    def test_search_clients_requires_agent(self, client, db_session):
        client_user = User(
            id="client-1",
            cognito_id="cognito-1",
            email="client@example.com",
            name="Client",
        )
        db_session.session.add(client_user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user", return_value=client_user):
            response = client.get(
                "/api/v1/agent/search-clients?q=ab",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )

        assert response.status_code == 403
        data = response.get_json()
        assert data["success"] is False
