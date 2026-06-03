"""Server-Sent Events stream for agent messaging (Redis Pub/Sub fan-out)."""

from __future__ import annotations

import json
import time
from collections.abc import Generator

from flask import Response, stream_with_context

from app.services.agent.messaging_realtime import CHANNEL_PREFIX, messaging_redis_url
from app.utils.cache.redis_client import create_messaging_pubsub_client
from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_authenticated_user,
    unauthorized,
)
from app.utils.security import rate_limit
from logger import log

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}

_HEARTBEAT_INTERVAL_S = 25.0
_PUBSUB_POLL_TIMEOUT_S = 20.0


def _heartbeat_loop() -> Generator[str, None, None]:
    while True:
        yield ": ping\n\n"
        time.sleep(_HEARTBEAT_INTERVAL_S)


def _messaging_sse_generator(user_id: str) -> Generator[str, None, None]:
    url = messaging_redis_url()
    hello = json.dumps({"kind": "_hello", "redis_fanout": bool(url)})
    yield f"data: {hello}\n\n"

    if not url:
        yield from _heartbeat_loop()
        return

    channel = f"{CHANNEL_PREFIX}{user_id}"
    client = create_messaging_pubsub_client()
    if client is None:
        yield from _heartbeat_loop()
        return

    pubsub = client.pubsub()
    try:
        try:
            pubsub.subscribe(channel)
        except Exception as exc:
            log.warn(
                "API",
                "messaging_sse subscribe failed; heartbeats only",
                {"user_id": user_id, "channel": channel, "error": str(exc)},
            )
            yield from _heartbeat_loop()
            return

        while True:
            try:
                msg = pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=_PUBSUB_POLL_TIMEOUT_S
                )
            except Exception as exc:
                log.warn(
                    "API",
                    "messaging_sse pubsub read failed; sending heartbeat",
                    {"user_id": user_id, "channel": channel, "error": str(exc)},
                )
                yield ": ping\n\n"
                continue

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
        return unauthorized()

    uid = str(user.id)
    return Response(
        stream_with_context(_messaging_sse_generator(uid)),
        mimetype="text/event-stream",
        headers=dict(_SSE_HEADERS),
    )
