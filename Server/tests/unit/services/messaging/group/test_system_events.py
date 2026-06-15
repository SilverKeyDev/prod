"""Group system event payload helpers."""

import pytest

from app.services.messaging.constants import GROUP_EVENT_PREFIX
from app.services.messaging.group.system_events import (
    build_group_event_message,
    parse_group_event_message,
)


class TestGroupSystemEvents:
    def test_build_and_parse_participant_joined(self):
        raw = build_group_event_message("participant_joined", {"user_id": "u1"})
        assert raw.startswith(GROUP_EVENT_PREFIX)
        parsed = parse_group_event_message(raw)
        assert parsed == {"type": "participant_joined", "user_id": "u1"}

    def test_parse_non_group_message_returns_none(self):
        assert parse_group_event_message("hello") is None

    def test_build_rejects_unknown_type(self):
        with pytest.raises(ValueError):
            build_group_event_message("unknown", {})
