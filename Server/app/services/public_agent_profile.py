"""Backward-compatible re-export; prefer ``app.services.public.agent_profile``."""

from app.services.public.agent_profile import build_public_agent_profile

__all__ = ["build_public_agent_profile"]
