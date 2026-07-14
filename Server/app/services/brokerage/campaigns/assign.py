"""Deterministic A/B variant assignment for email campaigns."""

from __future__ import annotations

import hashlib


def assign_variant(campaign_id: str, agent_id: str) -> str:
    """Return 'A' or 'B' via stable hash of campaign_id + agent_id."""
    digest = hashlib.sha256(f"{campaign_id}:{agent_id}".encode()).hexdigest()
    return "A" if int(digest[:8], 16) % 2 == 0 else "B"
