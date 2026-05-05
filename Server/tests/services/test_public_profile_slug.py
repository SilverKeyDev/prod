"""Unit tests for public profile slug helpers (no DB)."""

from app.services.public_profile_slug import (
    is_valid_public_profile_slug,
    slugify_display_name,
)


def test_slugify_display_name_matches_client_style() -> None:
    assert slugify_display_name("Jane Q. Agent!") == "jane-q-agent"


def test_is_valid_public_profile_slug() -> None:
    assert is_valid_public_profile_slug("jayce-walzer") is True
    assert is_valid_public_profile_slug("ab") is False
    assert is_valid_public_profile_slug("api") is False
    assert is_valid_public_profile_slug("valid-name-123") is True
