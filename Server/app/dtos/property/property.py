"""Backward-compatible alias for saved-home serialization. Prefer `SavedHomeDTO`."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.dtos.property.saved_home import SavedHomeDTO
from app.utils.db.orm_lookup import get_model

if TYPE_CHECKING:
    from app.models.property.property_cache import PropertyCache
    from app.models.property.user_property_link import UserPropertyLink


class PropertyDTO:
    """Convert PropertyCache+UserPropertyLink to the API shape."""

    @classmethod
    def to_saved_home(cls, link: UserPropertyLink) -> dict:
        """Build saved-home dict from a UserPropertyLink (loads PropertyCache automatically)."""
        from app.models import PropertyCache as PC

        prop = get_model(PC, link.property_id)
        if not prop:
            return {}
        return SavedHomeDTO.from_property_cache(prop, link).model_dump(mode="json")

    @classmethod
    def from_cache(cls, prop: PropertyCache, link: UserPropertyLink) -> dict:
        return SavedHomeDTO.from_property_cache(prop, link).model_dump(mode="json")
