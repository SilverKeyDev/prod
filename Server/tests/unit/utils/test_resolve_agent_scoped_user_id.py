"""Tests for resolve_agent_scoped_user_id using merged agent-client roster."""

from unittest.mock import Mock, patch

from app.models import AgentConnections, User
from app.utils.route.agent_scope import resolve_agent_scoped_user_id


class TestResolveAgentScopedUserId:
    def test_agent_allowed_via_connection_only(self, db_session):
        agent = User(
            id="agent-scoped-1",
            cognito_id="cog-agent-scoped-1",
            email="agent-scoped-1@example.com",
            name="Agent",
            is_agent=True,
        )
        client_u = User(
            id="client-scoped-1",
            cognito_id="cog-client-scoped-1",
            email="client-scoped-1@example.com",
            name="Client",
            is_agent=False,
        )
        db_session.session.add_all([agent, client_u])
        db_session.session.add(AgentConnections(agent_id=agent.id, client_id=client_u.id))
        db_session.session.commit()

        with patch(
            "app.utils.route.agent_scope.request",
            Mock(args=Mock(get=Mock(return_value=client_u.id))),
        ):
            target, err = resolve_agent_scoped_user_id(agent)

        assert err is None
        assert target == client_u.id

    def test_agent_denied_for_unrelated_client(self, db_session):
        agent = User(
            id="agent-scoped-2",
            cognito_id="cog-agent-scoped-2",
            email="agent-scoped-2@example.com",
            name="Agent 2",
            is_agent=True,
        )
        other = User(
            id="other-client",
            cognito_id="cog-other",
            email="other@example.com",
            name="Other",
            is_agent=False,
        )
        client_u = User(
            id="client-scoped-2",
            cognito_id="cog-client-scoped-2",
            email="client-scoped-2@example.com",
            name="Client 2",
            is_agent=False,
        )
        db_session.session.add_all([agent, other, client_u])
        db_session.session.add(AgentConnections(agent_id=agent.id, client_id=other.id))
        db_session.session.commit()

        with patch(
            "app.utils.route.agent_scope.request",
            Mock(args=Mock(get=Mock(return_value=client_u.id))),
        ):
            target, err = resolve_agent_scoped_user_id(agent)

        assert target is None
        assert err is not None
        assert err[1] == 403
