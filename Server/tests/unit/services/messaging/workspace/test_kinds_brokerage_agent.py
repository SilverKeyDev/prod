"""Brokerage-agent kind policy matrix."""

from types import SimpleNamespace

from app.services.messaging.workspace.kinds.brokerage_agent import BrokerageAgentPolicy
from tests.support.workspace_messaging_fixtures import (
    add_org_membership,
    create_brokerage_org,
    create_user,
)


class TestBrokerageAgentPolicy:
    def setup_method(self):
        self.policy = BrokerageAgentPolicy()

    def test_agent_in_org_may_access(self, db_session):
        org = create_brokerage_org(slug="ba-access-org")
        agent = create_user(user_id="agent-a", email="agent-a@test.com", roles=("agent",))
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        conv = SimpleNamespace(
            kind="brokerage_agent", brokerage_org_id=org.id, agent_user_id=agent.id
        )
        assert self.policy.may_access(agent, conv) is True

    def test_org_admin_may_access(self, db_session):
        org = create_brokerage_org(slug="ba-admin-org")
        admin = create_user(user_id="admin-a", email="admin-a@test.com")
        agent = create_user(user_id="agent-b", email="agent-b@test.com", roles=("agent",))
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        conv = SimpleNamespace(
            kind="brokerage_agent", brokerage_org_id=org.id, agent_user_id=agent.id
        )
        assert self.policy.may_access(admin, conv) is True

    def test_outsider_denied(self, db_session):
        org = create_brokerage_org(slug="ba-outsider-org")
        outsider = create_user(user_id="outsider", email="outsider@test.com")
        agent = create_user(user_id="agent-c", email="agent-c@test.com", roles=("agent",))
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        conv = SimpleNamespace(
            kind="brokerage_agent", brokerage_org_id=org.id, agent_user_id=agent.id
        )
        assert self.policy.may_access(outsider, conv) is False

    def test_admin_or_agent_may_create(self, db_session):
        org = create_brokerage_org(slug="ba-create-org")
        admin = create_user(user_id="admin-create", email="admin-create@test.com")
        agent = create_user(user_id="agent-create", email="agent-create@test.com", roles=("agent",))
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        payload = {"brokerage_org_id": org.id, "agent_user_id": agent.id}
        assert self.policy.may_create(admin, payload) is True
        assert self.policy.may_create(agent, payload) is True

    def test_list_eligible_contacts_for_admin(self, db_session):
        org = create_brokerage_org(slug="ba-contacts-org")
        admin = create_user(user_id="admin-contacts", email="admin-contacts@test.com")
        agent = create_user(
            user_id="agent-contacts",
            email="agent-contacts@test.com",
            name="Listed Agent",
            roles=("agent",),
        )
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        contacts = self.policy.list_eligible_contacts(admin)
        assert any(c.contact_id == agent.id and c.contact_type == "agent" for c in contacts)
