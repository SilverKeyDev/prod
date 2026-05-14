"""Integration-style IDOR checks for chat routes using real AgentConnections rows."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import AgentConnections, User

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


class TestAgentChatsIdorIntegration:
    """Non-participants must not read, send, or mark read on others' conversations."""

    def test_get_chat_history_denied_for_non_participant(self, client, db_session):
        agent = User(
            id="agent-a",
            cognito_id="cog-agent-a",
            email="agent-a-idor@example.com",
            name="Agent A",
            is_agent=True,
        )
        client_b = User(
            id="client-b",
            cognito_id="cog-client-b",
            email="client-b-idor@example.com",
            name="Client B",
            is_agent=False,
        )
        intruder = User(
            id="client-x",
            cognito_id="cog-client-x",
            email="intruder-idor@example.com",
            name="Intruder",
            is_agent=False,
        )
        conv = AgentConnections(id="conv-idor-1", agent_id=agent.id, client_id=client_b.id)
        db_session.session.add_all([agent, client_b, intruder, conv])
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_user:
            mock_user.return_value = intruder
            response = client.get(
                f"/api/v1/agent/chats/{conv.id}/history",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )
        assert response.status_code == 403
        assert response.get_json()["success"] is False

    def test_send_message_denied_for_non_participant(self, client, db_session):
        agent = User(
            id="agent-a2",
            cognito_id="cog-agent-a2",
            email="agent-a2-idor@example.com",
            name="Agent A2",
            is_agent=True,
        )
        client_b = User(
            id="client-b2",
            cognito_id="cog-client-b2",
            email="client-b2-idor@example.com",
            name="Client B2",
            is_agent=False,
        )
        intruder = User(
            id="client-x2",
            cognito_id="cog-client-x2",
            email="intruder2-idor@example.com",
            name="Intruder2",
            is_agent=False,
        )
        conv = AgentConnections(id="conv-idor-2", agent_id=agent.id, client_id=client_b.id)
        db_session.session.add_all([agent, client_b, intruder, conv])
        db_session.session.commit()

        with patch("app.routes.agent.handlers.chats.get_current_user") as mock_user:
            mock_user.return_value = intruder
            response = client.post(
                "/api/v1/agent/chats/message",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={"conversation_id": conv.id, "message": "Malicious"},
            )
        assert response.status_code == 403
        assert response.get_json()["success"] is False

    def test_mark_read_denied_for_non_participant(self, client, db_session):
        agent = User(
            id="agent-a3",
            cognito_id="cog-agent-a3",
            email="agent-a3-idor@example.com",
            name="Agent A3",
            is_agent=True,
        )
        client_b = User(
            id="client-b3",
            cognito_id="cog-client-b3",
            email="client-b3-idor@example.com",
            name="Client B3",
            is_agent=False,
        )
        intruder = User(
            id="client-x3",
            cognito_id="cog-client-x3",
            email="intruder3-idor@example.com",
            name="Intruder3",
            is_agent=False,
        )
        conv = AgentConnections(id="conv-idor-3", agent_id=agent.id, client_id=client_b.id)
        db_session.session.add_all([agent, client_b, intruder, conv])
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_user:
            mock_user.return_value = intruder
            response = client.post(
                f"/api/v1/agent/chats/{conv.id}/read",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )
        assert response.status_code == 403
        assert response.get_json()["success"] is False

    def test_create_chat_denied_without_prior_link(self, client, db_session):
        """Agent cannot open a conversation with an arbitrary client (no roster / link)."""
        agent = User(
            id="agent-unlinked",
            cognito_id="cog-agent-unlinked",
            email="agent-unlinked@example.com",
            name="Lonely Agent",
            is_agent=True,
            client_ids=None,
        )
        orphan = User(
            id="client-orphan",
            cognito_id="cog-orphan",
            email="orphan@example.com",
            name="Orphan Client",
            is_agent=False,
            agent_id=None,
        )
        db_session.session.add_all([agent, orphan])
        db_session.session.commit()

        with patch("app.utils.common_patterns.get_current_user") as mock_user:
            mock_user.return_value = agent
            response = client.post(
                "/api/v1/agent/chats",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                json={"client_id": orphan.id},
            )
        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "linked" in data["error"].lower() or "connection" in data["error"].lower()
