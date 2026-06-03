"""Unit tests for agent connection request listing (inbox vs initiated scope)."""

from sqlalchemy import select

from app import db
from app.models import AgentConnectionRequest, AgentConnections, User, UserRole
from app.services.agent.connection_request_service import (
    create_connection_request,
    get_connection_requests,
)


def _user(
    db_session,
    *,
    user_id: str,
    email: str,
    roles: tuple[str, ...] = (),
) -> User:
    user = User(
        id=user_id,
        cognito_id=f"cognito-{user_id}",
        email=email,
        name=email.split("@")[0].title(),
    )
    db_session.session.add(user)
    db_session.session.flush()
    for role in roles:
        db_session.session.add(UserRole(user_id=user.id, role=role))
    db_session.session.commit()
    return user


class TestGetConnectionRequestsScope:
    """partner_agent checklist: clients need initiated requests with all statuses."""

    def test_initiated_scope_returns_client_outgoing_requests_all_statuses(self, db_session):
        client = _user(db_session, user_id="client-1", email="buyer@example.com")
        agent_pending = _user(
            db_session,
            user_id="agent-pending",
            email="pending@example.com",
            roles=("agent",),
        )
        agent_declined = _user(
            db_session,
            user_id="agent-declined",
            email="declined@example.com",
            roles=("agent",),
        )
        agent_incoming = _user(
            db_session,
            user_id="agent-incoming",
            email="incoming@example.com",
            roles=("agent",),
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

        result = get_connection_requests(client.id, False, scope="initiated")
        agent_ids = {row["agent_id"] for row in result}
        statuses = {row["agent_id"]: row["status"] for row in result}

        assert agent_pending.id in agent_ids
        assert agent_declined.id in agent_ids
        assert agent_incoming.id not in agent_ids
        assert statuses[agent_pending.id] == "pending"
        assert statuses[agent_declined.id] == "rejected"

    def test_inbox_scope_returns_only_incoming_pending_for_client(self, db_session):
        client = _user(db_session, user_id="client-2", email="buyer2@example.com")
        agent = _user(
            db_session,
            user_id="agent-2",
            email="agent2@example.com",
            roles=("agent",),
        )

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

        result = get_connection_requests(client.id, False, scope="inbox")
        assert len(result) == 1
        assert result[0]["requested_by_agent"] is True
        assert result[0]["status"] == "pending"


class TestCreateConnectionRequestAutoAccept:
    """Client-initiated requests are accepted on create; agent-initiated stay pending."""

    def test_client_initiated_create_is_accepted_immediately(self, db_session):
        client = _user(db_session, user_id="client-auto", email="auto@example.com")
        agent = _user(
            db_session,
            user_id="agent-auto",
            email="agentauto@example.com",
            roles=("agent",),
        )

        result = create_connection_request(
            agent.id, client.id, requested_by_agent=False, message="Hi"
        )

        assert result["already_pending"] is False
        assert result["request"]["status"] == "accepted"
        assert result["request"]["requested_by_agent"] is False

        conv = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent.id, AgentConnections.client_id == client.id
            )
        )
        assert conv is not None

        agent_inbox = get_connection_requests(agent.id, True, scope="inbox")
        assert agent_inbox == []

    def test_client_initiated_already_pending_auto_accepts_on_retry(self, db_session):
        client = _user(db_session, user_id="client-retry", email="retry@example.com")
        agent = _user(
            db_session,
            user_id="agent-retry",
            email="agentretry@example.com",
            roles=("agent",),
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

        conv = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent.id, AgentConnections.client_id == client.id
            )
        )
        assert conv is not None

    def test_agent_initiated_create_stays_pending(self, db_session):
        client = _user(db_session, user_id="client-pend", email="pend@example.com")
        agent = _user(
            db_session,
            user_id="agent-pend",
            email="agentpend@example.com",
            roles=("agent",),
        )

        result = create_connection_request(agent.id, client.id, requested_by_agent=True)

        assert result["already_pending"] is False
        assert result["request"]["status"] == "pending"
        assert result["request"]["requested_by_agent"] is True
        assert result["request"]["other_party_name"] == client.name
        assert result["request"]["other_party_email"] == client.email

        client_inbox = get_connection_requests(client.id, False, scope="inbox")
        assert len(client_inbox) == 1
        assert client_inbox[0]["status"] == "pending"

        conv = db.session.scalar(
            select(AgentConnections).where(
                AgentConnections.agent_id == agent.id, AgentConnections.client_id == client.id
            )
        )
        assert conv is None
