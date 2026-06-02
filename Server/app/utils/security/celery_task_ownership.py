"""Register and verify Celery task ownership to prevent task-status IDOR."""

from __future__ import annotations

import os
import threading

from app.utils.cache.redis_client import get_shared_redis

_TASK_OWNER_PREFIX = "v1:celery_task_owner:"
_DEFAULT_TTL_SECONDS = 86400

_lock = threading.Lock()
_testing_owners: dict[str, str] = {}


def _use_testing_memory_store() -> bool:
    return os.getenv("TESTING", "").lower() == "true" and not os.getenv("REDIS_URL", "").strip()


def register_task_owner(
    task_id: str, user_id: str, ttl_seconds: int = _DEFAULT_TTL_SECONDS
) -> None:
    """Record which user enqueued a Celery task (required before polling task-status)."""
    tid = str(task_id).strip()
    uid = str(user_id).strip()
    if not tid or not uid:
        return

    if _use_testing_memory_store():
        with _lock:
            _testing_owners[tid] = uid
        return

    r = get_shared_redis()
    if r is None:
        return
    try:
        r.setex(f"{_TASK_OWNER_PREFIX}{tid}", ttl_seconds, uid)
    except Exception:
        pass


def verify_task_owner(task_id: str, user_id: str) -> bool:
    """True when *user_id* matches the user who registered the task."""
    tid = str(task_id).strip()
    uid = str(user_id).strip()
    if not tid or not uid:
        return False

    if _use_testing_memory_store():
        with _lock:
            owner = _testing_owners.get(tid)
        return owner is not None and owner == uid

    r = get_shared_redis()
    if r is None:
        return False
    try:
        owner = r.get(f"{_TASK_OWNER_PREFIX}{tid}")
        return owner is not None and str(owner) == uid
    except Exception:
        return False


def clear_task_owners_for_testing() -> None:
    """Reset in-memory task owners (pytest only)."""
    with _lock:
        _testing_owners.clear()
