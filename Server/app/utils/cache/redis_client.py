"""Shared Redis clients for cache, rate limits, messaging, and health probes."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import redis

_redis: redis.Redis | None = None
_pubsub_redis: redis.Redis | None = None

_REDIS_SOCKET_CONNECT_TIMEOUT_S = 2.0
_REDIS_SOCKET_TIMEOUT_S = 5.0
_REDIS_MAX_CONNECTIONS = 32


def redis_url() -> str | None:
    raw = (os.environ.get("REDIS_URL") or os.environ.get("CELERY_URL") or "").strip()
    return raw or None


def get_shared_redis() -> redis.Redis | None:
    """General-purpose pooled client (short read timeouts)."""
    global _redis
    if _redis is not None:
        return _redis
    url = redis_url()
    if not url:
        return None
    import redis as redis_lib

    _redis = redis_lib.Redis.from_url(
        url,
        decode_responses=True,
        max_connections=_REDIS_MAX_CONNECTIONS,
        socket_connect_timeout=_REDIS_SOCKET_CONNECT_TIMEOUT_S,
        socket_timeout=_REDIS_SOCKET_TIMEOUT_S,
    )
    return _redis


def get_pubsub_redis() -> redis.Redis | None:
    """Pooled client for blocking pub/sub reads (no socket read timeout)."""
    global _pubsub_redis
    if _pubsub_redis is not None:
        return _pubsub_redis
    url = redis_url()
    if not url:
        return None
    import redis as redis_lib

    _pubsub_redis = redis_lib.Redis.from_url(
        url,
        decode_responses=True,
        max_connections=_REDIS_MAX_CONNECTIONS,
        socket_connect_timeout=_REDIS_SOCKET_CONNECT_TIMEOUT_S,
        socket_timeout=None,
    )
    return _pubsub_redis


def ping_shared_redis() -> bool:
    client = get_shared_redis()
    if client is None:
        return False
    try:
        return bool(client.ping())
    except Exception:
        return False
