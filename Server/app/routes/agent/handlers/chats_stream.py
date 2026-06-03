"""Server-Sent Events stream for agent messaging (Redis Pub/Sub fan-out)."""

from __future__ import annotations

import json
import time
from collections.abc import Generator

from flask import Response, jsonify, stream_with_context

from app.services.agent.messaging_realtime import CHANNEL_PREFIX, messaging_redis_url
from app.utils.cache.redis_client import get_pubsub_redis
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security import rate_limit

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}


def _messaging_sse_generator(user_id: str) -> Generator[str, None, None]:
    url = messaging_redis_url()
    hello = json.dumps({"kind": "_hello", "redis_fanout": bool(url)})
    yield f"data: {hello}\n\n"

    if not url:
        while True:
            yield ": ping\n\n"
            time.sleep(25.0)

    channel = f"{CHANNEL_PREFIX}{user_id}"
    client = get_pubsub_redis()
    if client is None:
        while True:
            yield ": ping\n\n"
            time.sleep(25.0)

    pubsub = client.pubsub()
    try:
        pubsub.subscribe(channel)
        while True:
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=20.0)
            if msg and msg.get("type") == "message" and msg.get("data"):
                yield f"data: {msg['data']}\n\n"
            else:
                yield ": ping\n\n"
    finally:
        try:
            pubsub.unsubscribe(channel)
            pubsub.close()
        except Exception:
            pass
        try:
            client.close()
        except Exception:
            pass


@rate_limit(max_requests=40, window_seconds=60, per="user")
@handle_exceptions_with_logging
@require_authenticated_user
def stream_agent_chat_events(user):
    if not user.id:
        return jsonify({"success": False, "error": "Invalid user session"}), 401

    uid = str(user.id)
    return Response(
        stream_with_context(_messaging_sse_generator(uid)),
        mimetype="text/event-stream",
        headers=dict(_SSE_HEADERS),
    )
