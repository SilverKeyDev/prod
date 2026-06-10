"""Integrator-brokerage kind policy matrix."""

from types import SimpleNamespace

from app.services.messaging.workspace.kinds.integrator_brokerage import IntegratorBrokeragePolicy
from tests.support.workspace_messaging_fixtures import (
    add_org_membership,
    adopt_partner,
    create_brokerage_org,
    create_partner,
    create_user,
    link_partner_operator,
)


class TestIntegratorBrokeragePolicy:
    def setup_method(self):
        self.policy = IntegratorBrokeragePolicy()

    def test_integrator_operator_may_access(self, db_session):
        org = create_brokerage_org(slug="ib-org-1")
        partner = create_partner(partner_id="p-ib-1", slug="ib-partner-1")
        operator = create_user(user_id="op-1", email="op-1@test.com")
        link_partner_operator(user_id=operator.id, partner_id=partner.id)
        adopt_partner(org_id=org.id, partner_id=partner.id)
        db_session.session.commit()

        conv = SimpleNamespace(
            kind="integrator_brokerage", brokerage_org_id=org.id, partner_id=partner.id
        )
        assert self.policy.may_access(operator, conv) is True

    def test_brokerage_admin_may_access(self, db_session):
        org = create_brokerage_org(slug="ib-org-2")
        partner = create_partner(partner_id="p-ib-2", slug="ib-partner-2")
        admin = create_user(user_id="admin-ib", email="admin-ib@test.com")
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        adopt_partner(org_id=org.id, partner_id=partner.id)
        db_session.session.commit()

        conv = SimpleNamespace(
            kind="integrator_brokerage", brokerage_org_id=org.id, partner_id=partner.id
        )
        assert self.policy.may_access(admin, conv) is True

    def test_may_create_requires_adoption(self, db_session):
        org = create_brokerage_org(slug="ib-org-3")
        partner = create_partner(partner_id="p-ib-3", slug="ib-partner-3")
        operator = create_user(user_id="op-3", email="op-3@test.com")
        link_partner_operator(user_id=operator.id, partner_id=partner.id)
        db_session.session.commit()

        payload = {"brokerage_org_id": org.id, "partner_id": partner.id}
        assert self.policy.may_create(operator, payload) is False

        adopt_partner(org_id=org.id, partner_id=partner.id)
        db_session.session.commit()
        assert self.policy.may_create(operator, payload) is True

    def test_list_eligible_contacts_for_integrator(self, db_session):
        org = create_brokerage_org(slug="ib-org-4", name="Adopted Brokerage")
        partner = create_partner(partner_id="p-ib-4", slug="ib-partner-4")
        operator = create_user(user_id="op-4", email="op-4@test.com")
        link_partner_operator(user_id=operator.id, partner_id=partner.id)
        adopt_partner(org_id=org.id, partner_id=partner.id)
        db_session.session.commit()

        contacts = self.policy.list_eligible_contacts(operator)
        assert any(c.contact_id == org.id and c.contact_type == "brokerage" for c in contacts)
