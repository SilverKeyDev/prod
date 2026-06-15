"""Tests for client_service relationship and ID merge helpers."""

from app.models import AgentConnections, User, UserRole
from app.services.agent.client_service import (
    agent_may_access_client,
    get_agent_client_ids,
    get_connected_agent_ids_for_client,
    get_user_agent_id,
    validate_agent_client_relationship,
)
from app.services.auth.user_role_helpers import ensure_user_role


def _add_agent_client(db_session, agent: User, client_u: User) -> None:
    ensure_user_role(str(agent.id), "agent")
    db_session.session.add(AgentConnections(agent_id=str(agent.id), client_id=str(client_u.id)))


def test_agent_may_access_client_matches_validate(db_session):
    agent = User(
        id="rel-am1",
        cognito_id="cog-rel-am1",
        email="rel-am1@example.com",
        name="Agent",
    )
    client_u = User(
        id="rel-amc1",
        cognito_id="cog-rel-amc1",
        email="rel-amc1@example.com",
        name="Client",
    )
    db_session.session.add_all([agent, client_u])

    _add_agent_client(db_session, agent, client_u)
    db_session.session.commit()

    assert agent_may_access_client("rel-am1", "rel-amc1") is True
    assert validate_agent_client_relationship("rel-am1", "rel-amc1") is True


def test_validate_agent_client_relationship_true_from_connection(db_session):
    agent = User(
        id="rel-a1",
        cognito_id="cog-rel-a1",
        email="rel-a1@example.com",
        name="Agent",
    )
    client_u = User(
        id="rel-c1",
        cognito_id="cog-rel-c1",
        email="rel-c1@example.com",
        name="Client",
    )
    db_session.session.add_all([agent, client_u])

    _add_agent_client(db_session, agent, client_u)
    db_session.session.commit()

    assert validate_agent_client_relationship("rel-a1", "rel-c1") is True


def test_validate_agent_client_relationship_true_from_connection_only(db_session):
    agent = User(
        id="rel-a2",
        cognito_id="cog-rel-a2",
        email="rel-a2@example.com",
        name="Agent 2",
    )
    client_u = User(
        id="rel-c2",
        cognito_id="cog-rel-c2",
        email="rel-c2@example.com",
        name="Client 2",
    )
    db_session.session.add_all([agent, client_u])

    _add_agent_client(db_session, agent, client_u)
    db_session.session.commit()

    assert validate_agent_client_relationship("rel-a2", "rel-c2") is True


def test_validate_agent_client_relationship_false_when_unrelated(db_session):
    agent = User(
        id="rel-a3",
        cognito_id="cog-rel-a3",
        email="rel-a3@example.com",
        name="Agent 3",
    )
    client_u = User(
        id="rel-c3",
        cognito_id="cog-rel-c3",
        email="rel-c3@example.com",
        name="Client 3",
    )
    other = User(
        id="rel-c-other",
        cognito_id="cog-rel-o",
        email="other@example.com",
        name="Other",
    )
    db_session.session.add_all([agent, client_u, other])

    ensure_user_role("rel-a3", "agent")
    db_session.session.add(AgentConnections(agent_id="rel-a3", client_id="rel-c-other"))
    db_session.session.commit()

    assert validate_agent_client_relationship("rel-a3", "rel-c3") is False


def test_get_agent_client_ids_from_connections(db_session):
    agent = User(
        id="gac-a",
        cognito_id="cog-gac-a",
        email="gac-a@example.com",
        name="Agent G",
    )
    c1 = User(
        id="gac-1",
        cognito_id="cog-gac-1",
        email="1@gac.example.com",
        name="One",
    )
    c2 = User(
        id="gac-2",
        cognito_id="cog-gac-2",
        email="2@gac.example.com",
        name="Two",
    )
    db_session.session.add_all([agent, c1, c2])

    ensure_user_role("gac-a", "agent")
    db_session.session.add(AgentConnections(agent_id="gac-a", client_id="gac-1"))
    db_session.session.add(AgentConnections(agent_id="gac-a", client_id="gac-2"))
    db_session.session.commit()

    ids = set(get_agent_client_ids("gac-a"))
    assert ids == {"gac-1", "gac-2"}


def test_get_connected_agent_ids_for_client_from_connections(db_session):
    agent_a = User(
        id="gca-a",
        cognito_id="cog-gca-a",
        email="gca-a@example.com",
        name="Agent A",
    )
    agent_b = User(
        id="gca-b",
        cognito_id="cog-gca-b",
        email="gca-b@example.com",
        name="Agent B",
    )
    client_u = User(
        id="gca-c",
        cognito_id="cog-gca-c",
        email="gca-c@example.com",
        name="Client",
    )
    db_session.session.add_all([agent_a, agent_b, client_u])

    db_session.session.add(UserRole(user_id="gca-a", role="agent"))
    db_session.session.add(UserRole(user_id="gca-b", role="agent"))
    db_session.session.add(AgentConnections(agent_id="gca-a", client_id="gca-c"))
    db_session.session.add(AgentConnections(agent_id="gca-b", client_id="gca-c"))
    db_session.session.commit()

    ids = get_connected_agent_ids_for_client("gca-c")
    assert ids == {"gca-a", "gca-b"}


def test_get_user_agent_id_from_connection(db_session):
    agent = User(
        id="gua-a",
        cognito_id="cog-gua-a",
        email="gua-a@example.com",
        name="Agent",
    )
    client_u = User(
        id="gua-c",
        cognito_id="cog-gua-c",
        email="gua-c@example.com",
        name="Client",
    )
    db_session.session.add_all([agent, client_u])

    _add_agent_client(db_session, agent, client_u)
    db_session.session.commit()

    assert get_user_agent_id("gua-c") == "gua-a"


def test_get_user_agent_id_falls_back_to_connection(db_session):
    agent = User(
        id="gua-a2",
        cognito_id="cog-gua-a2",
        email="gua-a2@example.com",
        name="Agent 2",
    )
    client_u = User(
        id="gua-c2",
        cognito_id="cog-gua-c2",
        email="gua-c2@example.com",
        name="Client 2",
    )
    db_session.session.add_all([agent, client_u])

    _add_agent_client(db_session, agent, client_u)
    db_session.session.commit()

    assert get_user_agent_id("gua-c2") == "gua-a2"
