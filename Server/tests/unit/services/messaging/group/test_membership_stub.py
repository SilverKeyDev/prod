"""Group membership stub behavior."""

import pytest

from app.services.messaging.group.membership import GroupMembershipServiceStub


class TestGroupMembershipStub:
    def setup_method(self):
        self.svc = GroupMembershipServiceStub()

    @pytest.mark.parametrize(
        "method,args,kwargs",
        [
            ("add_participant", ("conv-1", "u-1"), {"added_by_user_id": "u-2"}),
            ("remove_participant", ("conv-1", "u-1"), {"removed_by_user_id": "u-2"}),
            ("list_active_participants", ("conv-1",), {}),
            ("assert_can_manage_group", ("conv-1", "u-1"), {}),
        ],
    )
    def test_methods_raise_not_implemented(self, method, args, kwargs):
        fn = getattr(self.svc, method)
        with pytest.raises(NotImplementedError):
            fn(*args, **kwargs)
