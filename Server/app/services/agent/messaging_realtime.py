"""Optional Redis Pub/Sub fan-out for agent messaging (SSE subscribers)."""

from __future__ import annotations

import json
from typing import Any

from app.utils.cache.redis_client import get_shared_redis, redis_url
from logger import log

CHANNEL_PREFIX = "sk:messaging:user:"


def messaging_redis_url() -> str | None:
    """Prefer dedicated REDIS_URL; fall back to Celery broker URL."""
    return redis_url()


def publish_messaging_user_payload(user_id: str, payload: dict[str, Any]) -> None:
    client = get_shared_redis()
    if client is None:
        return
    try:
        client.publish(f"{CHANNEL_PREFIX}{user_id}", json.dumps(payload))
    except Exception as e:
        log.warn(
            "API",
            "messaging_realtime publish skipped",
            {"user_id": str(user_id), "error": str(e)},
        )


def notify_conversation_participants_new_message(
    agent_id: str, client_id: str, conversation_id: str, message_id: str
) -> None:
    body: dict[str, Any] = {
        "kind": "new_message",
        "conversation_id": conversation_id,
        "message_id": message_id,
    }
    for uid in {str(agent_id), str(client_id)}:
        publish_messaging_user_payload(uid, body)


def notify_conversation_participants_read(
    agent_id: str, client_id: str, conversation_id: str, reader_id: str
) -> None:
    body: dict[str, Any] = {
        "kind": "conversation_read",
        "conversation_id": conversation_id,
        "reader_id": str(reader_id),
    }
    for uid in {str(agent_id), str(client_id)}:
        publish_messaging_user_payload(uid, body)
