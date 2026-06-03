"""Tests for messaging Redis pub/sub using the shared client pool."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.agent.messaging_realtime import (
    CHANNEL_PREFIX,
    publish_messaging_user_payload,
)


@patch("app.services.agent.messaging_realtime.get_shared_redis")
def test_publish_uses_shared_redis_client(mock_get_redis):
    mock_client = MagicMock()
    mock_get_redis.return_value = mock_client

    publish_messaging_user_payload("user-123", {"kind": "new_message", "conversation_id": "c1"})

    mock_client.publish.assert_called_once()
    channel, payload = mock_client.publish.call_args[0]
    assert channel == f"{CHANNEL_PREFIX}user-123"
    assert "new_message" in payload


@patch("app.services.agent.messaging_realtime.get_shared_redis")
def test_publish_noops_when_redis_unavailable(mock_get_redis):
    mock_get_redis.return_value = None
    publish_messaging_user_payload("user-123", {"kind": "ping"})
