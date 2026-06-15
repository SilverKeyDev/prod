"""Optional read-through cache for small JSON blobs (public GETs).

- Keys: use ``app.utils.http.cache.REDIS_KEY_PREFIX_V1`` + stable id (e.g. agent user_id).
- TTL: keep short (60–300s); call ``delete_key`` in the same code path that updates data.

If ``REDIS_URL`` is unset, functions no-op (use HTTP ``Cache-Control`` via
``apply_edge_cache`` in the handler).

Client creation uses the shared pooled Redis client in ``redis_client.py``.
"""

from __future__ import annotations

import json
from typing import Any

import redis

from app.utils.cache.redis_client import get_shared_redis


def get_json(key: str) -> dict[str, Any] | None:
    r = get_shared_redis()
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
    r = get_shared_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(data, separators=(",", ":"), default=str))
    except redis.exceptions.RedisError:
        pass


def delete_key(key: str) -> None:
    r = get_shared_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except redis.exceptions.RedisError:
        pass
