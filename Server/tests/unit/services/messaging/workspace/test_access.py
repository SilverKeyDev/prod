"""Workspace conversation kind policy access matrix."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.services.messaging.workspace.access import user_may_access_workspace_conversation
from app.services.messaging.workspace.kinds import KIND_REGISTRY


@pytest.mark.parametrize("kind", sorted(KIND_REGISTRY.keys()))
def test_unknown_user_denied_for_all_kinds(kind):
    conv = SimpleNamespace(
        kind=kind,
        subject_user_id="subj-1",
        brokerage_org_id="org-1",
        partner_id="p-1",
        agent_user_id="agent-1",
    )
    assert user_may_access_workspace_conversation(None, conv) is False
    assert user_may_access_workspace_conversation(SimpleNamespace(id=None), conv) is False


class TestPlatformSupportAccess:
    def test_subject_user_may_access(self):
        policy = KIND_REGISTRY["platform_support"]
        user = SimpleNamespace(id="u1", roles=[])
        conv = SimpleNamespace(
            kind="platform_support", subject_user_id="u1", support_category="brokerage"
        )
        assert policy.may_access(user, conv) is True

    def test_super_admin_may_access_via_dispatcher(self):
        user = SimpleNamespace(id="admin-1", roles=["super_admin"])
        conv = SimpleNamespace(
            kind="platform_support", subject_user_id="other", support_category="integrator"
        )
        with patch(
            "app.services.messaging.workspace.access.user_has_super_admin_role",
            return_value=True,
        ):
            assert user_may_access_workspace_conversation(user, conv) is True

    def test_other_user_denied(self):
        policy = KIND_REGISTRY["platform_support"]
        user = SimpleNamespace(id="u2", roles=[])
        conv = SimpleNamespace(
            kind="platform_support", subject_user_id="u1", support_category="brokerage"
        )
        with patch(
            "app.services.messaging.workspace.kinds.platform_support.user_has_super_admin_role",
            return_value=False,
        ):
            assert policy.may_access(user, conv) is False
