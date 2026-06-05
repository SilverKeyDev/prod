#!/usr/bin/env python3
"""Ping Redis for load balancers and deploy smoke tests.

Prefers REDIS_URL, then CELERY_URL, then redis://127.0.0.1:6379/0.

Usage (from repo root, with redis package available):

    python3 Server/scripts/redis_healthcheck.py

Exit 0 on PONG, 1 on failure.
"""

from __future__ import annotations

import os
import sys

try:
    import redis
except ImportError:
    sys.stderr.write("redis_healthcheck: the 'redis' package is required (pip install redis).\n")
    sys.exit(1)


def _redis_url() -> str:
    for var in ("REDIS_URL", "CELERY_URL"):
        raw = os.getenv(var, "").strip()
        if raw:
            return raw
    return "redis://127.0.0.1:6379/0"


def main() -> None:
    url = _redis_url()
    client = redis.Redis.from_url(
        url,
        socket_connect_timeout=5.0,
        socket_timeout=5.0,
        retry_on_timeout=False,
    )
    try:
        if client.ping():
            sys.exit(0)
        sys.stderr.write("redis_healthcheck: unexpected PING response.\n")
        sys.exit(1)
    except redis.exceptions.RedisError as exc:
        sys.stderr.write(f"redis_healthcheck: Redis error: {exc!s}\n")
        sys.exit(1)
    finally:
        try:
            client.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
