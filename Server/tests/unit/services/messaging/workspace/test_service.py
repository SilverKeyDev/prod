"""Workspace conversation service orchestration tests."""

from app.services.messaging.workspace.service import (
    create_conversation,
    list_eligible_contacts,
    send_message,
)
from tests.support.workspace_messaging_fixtures import (
    add_org_membership,
    create_brokerage_org,
    create_user,
)


class TestWorkspaceConversationService:
    def test_create_platform_support_dedupes(self, db_session):
        admin = create_user(user_id="sup-1", email="sup-1@test.com")
        org = create_brokerage_org(slug="sup-org")
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        db_session.session.commit()

        first = create_conversation(
            admin, {"kind": "platform_support", "support_category": "brokerage"}
        )
        second = create_conversation(
            admin, {"kind": "platform_support", "support_category": "brokerage"}
        )
        assert first["id"] == second["id"]

    def test_create_group_rejected(self, db_session):
        user = create_user(user_id="grp-1", email="grp-1@test.com")
        db_session.session.commit()
        try:
            create_conversation(user, {"kind": "group", "title": "nope"})
            assert False, "expected ValueError"
        except ValueError as e:
            assert "not available" in str(e).lower()

    def test_send_message_requires_access(self, db_session):
        admin = create_user(user_id="send-admin", email="send-admin@test.com")
        org = create_brokerage_org(slug="send-org")
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        outsider = create_user(user_id="send-outsider", email="send-outsider@test.com")
        db_session.session.commit()

        conv = create_conversation(
            admin, {"kind": "platform_support", "support_category": "brokerage"}
        )
        send_message(admin, conversation_id=conv["id"], message="hello")
        try:
            send_message(outsider, conversation_id=conv["id"], message="blocked")
            assert False, "expected ValueError"
        except ValueError as e:
            assert "Access denied" in str(e)

    def test_list_eligible_contacts_merges_kinds(self, db_session):
        org = create_brokerage_org(slug="elig-org")
        admin = create_user(user_id="elig-admin", email="elig-admin@test.com")
        agent = create_user(user_id="elig-agent", email="elig-agent@test.com", roles=("agent",))
        add_org_membership(user_id=admin.id, org_id=org.id, role="admin")
        add_org_membership(user_id=agent.id, org_id=org.id, role="agent")
        db_session.session.commit()

        contacts = list_eligible_contacts(admin, kinds=["brokerage_agent"])
        assert any(c["contact_id"] == agent.id for c in contacts)
