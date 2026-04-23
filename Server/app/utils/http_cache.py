"""HTTP `Cache-Control` helpers and Redis key naming for optional response caching.

For public JSON that may be cached behind a CDN: use short `max-age` plus
`stale-while-revalidate` so browsers and intermediates can reuse responses.

Redis read-through pattern (when you add caching to a route):
  key: ``{namespace}:{version}:{stable_id}`` e.g. ``v1:public:agent:`` + user_id
  TTL: 60–300s; delete key when the same handler performs a user-visible update.
"""

from __future__ import annotations

from typing import Any

REDIS_KEY_PREFIX_V1 = "v1:public:agent"
"""Prefix for public agent profile JSON in Redis, if you add read-through there."""


def apply_edge_cache(
    response: Any,
    *,
    max_age: int = 60,
    stale_while_revalidate: int = 0,
) -> None:
    """Set Cache-Control for safe, public GET JSON (not for authenticated or volatile data)."""
    parts: list[str] = ["public", f"max-age={max_age}"]
    if stale_while_revalidate > 0:
        parts.append(f"stale-while-revalidate={stale_while_revalidate}")
    response.headers["Cache-Control"] = ", ".join(parts)
