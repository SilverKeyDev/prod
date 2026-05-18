"""Optional read-through cache for small JSON blobs (public GETs).

- Keys: use ``app.utils.http.cache.REDIS_KEY_PREFIX_V1`` + stable id (e.g. agent user_id).
- TTL: keep short (60–300s); call ``delete_key`` in the same code path that updates data.

If ``REDIS_URL`` is unset, functions no-op (use HTTP ``Cache-Control`` via
``apply_edge_cache`` in the handler).

Client creation follows Redis client guidance: bounded pool (``max_connections``),
connect/read timeouts, and ``retry_on_timeout`` so a slow or flaky Redis does not
hold workers indefinitely.
"""

from __future__ import annotations

import json
import os
from typing import Any

import redis

_redis: redis.Redis | None = None

# Small JSON cache: short timeouts, modest pool (many workers share one client).
_REDIS_SOCKET_CONNECT_TIMEOUT_S = 2.0
_REDIS_SOCKET_TIMEOUT_S = 5.0
_REDIS_MAX_CONNECTIONS = 32


def _get_redis() -> redis.Redis | None:
    global _redis
    if _redis is not None:
        return _redis
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return None
    _redis = redis.Redis.from_url(
        url,
        decode_responses=True,
        max_connections=_REDIS_MAX_CONNECTIONS,
        socket_connect_timeout=_REDIS_SOCKET_CONNECT_TIMEOUT_S,
        socket_timeout=_REDIS_SOCKET_TIMEOUT_S,
        retry_on_timeout=True,
    )
    return _redis


def get_json(key: str) -> dict[str, Any] | None:
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = r.get(key)
        if not raw:
            return None
        return json.loads(raw)
    except (redis.exceptions.RedisError, json.JSONDecodeError, TypeError):
        return None


def set_json(key: str, data: dict[str, Any], ttl_seconds: int) -> None:
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(data, separators=(",", ":"), default=str))
    except redis.exceptions.RedisError:
        pass


def delete_key(key: str) -> None:
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except redis.exceptions.RedisError:
        pass
