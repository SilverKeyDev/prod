"""System event payloads for group chat threads."""

from __future__ import annotations

import json
from typing import Any

from app.services.messaging.constants import GROUP_EVENT_PREFIX

GROUP_EVENT_TYPES = frozenset(
    {
        "participant_joined",
        "participant_left",
        "title_changed",
    }
)


def build_group_event_message(event_type: str, payload: dict[str, Any]) -> str:
    if event_type not in GROUP_EVENT_TYPES:
        raise ValueError(f"Unknown group event type: {event_type}")
    body = {"type": event_type, **payload}
    return f"{GROUP_EVENT_PREFIX}{json.dumps(body, separators=(',', ':'))}"


def parse_group_event_message(message: str) -> dict[str, Any] | None:
    if not message or not message.startswith(GROUP_EVENT_PREFIX):
        return None
    raw = message[len(GROUP_EVENT_PREFIX) :]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict) or data.get("type") not in GROUP_EVENT_TYPES:
        return None
    return data
