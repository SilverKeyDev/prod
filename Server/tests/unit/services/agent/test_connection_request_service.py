"""Unit tests for agent connection request listing (inbox vs initiated scope)."""

from app.models import AgentConnectionRequest, AgentConnections, User
from app.services.agent.connection_request_service import (
    create_connection_request,
    get_connection_requests,
)


def _user(
    db_session,
    *,
    user_id: str,
    email: str,
    is_agent: bool,
) -> User:
    user = User(
        id=user_id,
        cognito_id=f"cognito-{user_id}",
        email=email,
        name=email.split("@")[0].title(),
        is_agent=is_agent,
    )
    db_session.session.add(user)
    db_session.session.commit()
    return user


class TestGetConnectionRequestsScope:
    """partner_agent checklist: clients need initiated requests with all statuses."""

    def test_initiated_scope_returns_client_outgoing_requests_all_statuses(self, db_session):
        client = _user(db_session, user_id="client-1", email="buyer@example.com", is_agent=False)
        agent_pending = _user(
            db_session, user_id="agent-pending", email="pending@example.com", is_agent=True
        )
        agent_declined = _user(
            db_session, user_id="agent-declined", email="declined@example.com", is_agent=True
        )
        agent_incoming = _user(
            db_session, user_id="agent-incoming", email="incoming@example.com", is_agent=True
        )

        db_session.session.add_all(
            [
                AgentConnectionRequest(
                    agent_id=agent_pending.id,
                    client_id=client.id,
                    requested_by_agent=False,
                    status="pending",
                    message="Please connect",
                ),
                AgentConnectionRequest(
                    agent_id=agent_declined.id,
                    client_id=client.id,
                    requested_by_agent=False,
                    status="rejected",
                ),
                AgentConnectionRequest(
                    agent_id=agent_incoming.id,
                    client_id=client.id,
                    requested_by_agent=True,
                    status="pending",
                ),
            ]
        )
        db_session.session.commit()

        result = get_connection_requests(client.id, is_agent=False, scope="initiated")
        agent_ids = {row["agent_id"] for row in result}
        statuses = {row["agent_id"]: row["status"] for row in result}

        assert agent_pending.id in agent_ids
        assert agent_declined.id in agent_ids
        assert agent_incoming.id not in agent_ids
        assert statuses[agent_pending.id] == "pending"
        assert statuses[agent_declined.id] == "rejected"

    def test_inbox_scope_returns_only_incoming_pending_for_client(self, db_session):
        client = _user(db_session, user_id="client-2", email="buyer2@example.com", is_agent=False)
        agent = _user(db_session, user_id="agent-2", email="agent2@example.com", is_agent=True)

        db_session.session.add(
            AgentConnectionRequest(
                agent_id=agent.id,
                client_id=client.id,
                requested_by_agent=True,
                status="pending",
            )
        )
        db_session.session.add(
            AgentConnectionRequest(
                agent_id=agent.id,
                client_id=client.id,
                requested_by_agent=False,
                status="pending",
            )
        )
        db_session.session.commit()

        result = get_connection_requests(client.id, is_agent=False, scope="inbox")
        assert len(result) == 1
        assert result[0]["requested_by_agent"] is True
        assert result[0]["status"] == "pending"


class TestCreateConnectionRequestAutoAccept:
    """Client-initiated requests are accepted on create; agent-initiated stay pending."""

    def test_client_initiated_create_is_accepted_immediately(self, db_session):
        client = _user(db_session, user_id="client-auto", email="auto@example.com", is_agent=False)
        agent = _user(
            db_session, user_id="agent-auto", email="agentauto@example.com", is_agent=True
        )

        result = create_connection_request(
            agent.id, client.id, requested_by_agent=False, message="Hi"
        )

        assert result["already_pending"] is False
        assert result["request"]["status"] == "accepted"
        assert result["request"]["requested_by_agent"] is False

        conv = AgentConnections.query.filter_by(agent_id=agent.id, client_id=client.id).first()
        assert conv is not None

        agent_inbox = get_connection_requests(agent.id, is_agent=True, scope="inbox")
        assert agent_inbox == []

    def test_client_initiated_already_pending_auto_accepts_on_retry(self, db_session):
        client = _user(
            db_session, user_id="client-retry", email="retry@example.com", is_agent=False
        )
        agent = _user(
            db_session, user_id="agent-retry", email="agentretry@example.com", is_agent=True
        )

        db_session.session.add(
            AgentConnectionRequest(
                agent_id=agent.id,
                client_id=client.id,
                requested_by_agent=False,
                status="pending",
            )
        )
        db_session.session.commit()

        result = create_connection_request(agent.id, client.id, requested_by_agent=False)

        assert result["already_pending"] is True
        assert result["request"]["status"] == "accepted"

        conv = AgentConnections.query.filter_by(agent_id=agent.id, client_id=client.id).first()
        assert conv is not None

    def test_agent_initiated_create_stays_pending(self, db_session):
        client = _user(db_session, user_id="client-pend", email="pend@example.com", is_agent=False)
        agent = _user(
            db_session, user_id="agent-pend", email="agentpend@example.com", is_agent=True
        )

        result = create_connection_request(agent.id, client.id, requested_by_agent=True)

        assert result["already_pending"] is False
        assert result["request"]["status"] == "pending"
        assert result["request"]["requested_by_agent"] is True

        client_inbox = get_connection_requests(client.id, is_agent=False, scope="inbox")
        assert len(client_inbox) == 1
        assert client_inbox[0]["status"] == "pending"

        conv = AgentConnections.query.filter_by(agent_id=agent.id, client_id=client.id).first()
        assert conv is None
