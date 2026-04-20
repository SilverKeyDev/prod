"""Cooldown for SilverKey owned-calendar duplicate cleanup bursts."""

import threading
import time

from .calendar_management_constants import SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC

_silverkey_owned_dedupe_last: dict[str, float] = {}
_silverkey_owned_dedupe_lock = threading.Lock()


def should_skip_silverkey_owned_dedupe(user_id: str) -> bool:
    with _silverkey_owned_dedupe_lock:
        last = _silverkey_owned_dedupe_last.get(user_id)
        if last is None:
            return False
        return (time.monotonic() - last) < SILVERKEY_OWNED_DEDUPE_COOLDOWN_SEC


def mark_silverkey_owned_dedupe_attempt(user_id: str) -> None:
    with _silverkey_owned_dedupe_lock:
        _silverkey_owned_dedupe_last[user_id] = time.monotonic()
