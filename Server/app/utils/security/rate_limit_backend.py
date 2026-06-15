"""Rate limit storage backends: in-memory (dev/test) and Redis (production)."""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from app.utils.cache.redis_client import get_shared_redis

# Thread-safe in-memory storage (used when Redis is unavailable).
rate_limit_storage: defaultdict[str, deque[float]] = defaultdict(lambda: deque())
storage_lock = threading.Lock()


def allow_request(key: str, max_requests: int, window_seconds: int) -> bool:
    """Return True if the request is within the rate limit."""
    redis_client = get_shared_redis()
    if redis_client is not None:
        return _allow_request_redis(redis_client, key, max_requests, window_seconds)
    return _allow_request_memory(key, max_requests, window_seconds)


def _allow_request_memory(key: str, max_requests: int, window_seconds: int) -> bool:
    current_time = time.time()
    with storage_lock:
        request_times = rate_limit_storage[key]
        while request_times and request_times[0] < current_time - window_seconds:
            request_times.popleft()
        if len(request_times) >= max_requests:
            return False
        request_times.append(current_time)
        return True


def _allow_request_redis(
    redis_client,
    key: str,
    max_requests: int,
    window_seconds: int,
) -> bool:
    now = time.time()
    window_start = now - window_seconds
    try:
        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds + 1)
        results = pipe.execute()
        count = int(results[2])
        return count <= max_requests
    except Exception:
        return _allow_request_memory(key, max_requests, window_seconds)
