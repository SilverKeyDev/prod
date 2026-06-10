"""Backward-compatible re-export; prefer ``app.services.public.profile_slug``."""

from app.services.public.profile_slug import (
    MAX_PUBLIC_PROFILE_SLUG_LEN,
    MIN_PUBLIC_PROFILE_SLUG_LEN,
    RESERVED_PUBLIC_PROFILE_SLUGS,
    ensure_public_profile_slug,
    is_valid_public_profile_slug,
    lookup_agent_user_id_by_public_slug,
    normalize_public_profile_slug_input,
    slugify_display_name,
)

__all__ = [
    "MAX_PUBLIC_PROFILE_SLUG_LEN",
    "MIN_PUBLIC_PROFILE_SLUG_LEN",
    "RESERVED_PUBLIC_PROFILE_SLUGS",
    "ensure_public_profile_slug",
    "is_valid_public_profile_slug",
    "lookup_agent_user_id_by_public_slug",
    "normalize_public_profile_slug_input",
    "slugify_display_name",
]
