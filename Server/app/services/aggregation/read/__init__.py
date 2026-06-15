"""Read-side preference aggregation (flatten normalized models for API consumers)."""

from app.services.aggregation.read.extended_buyer_preferences import (
    apply_extended_buyer_preference_canonical_keys,
    coerce_extension_value,
    merge_extended_buyer_preferences,
    normalize_stored_document,
)
from app.services.aggregation.read.preferences_aggregation import (
    apply_canonical_housing_preference_keys,
    get_preferences_dict_for_user,
    get_preferences_dict_optional,
    get_preferences_updated_at,
    user_has_preferences,
)

__all__ = [
    "apply_canonical_housing_preference_keys",
    "apply_extended_buyer_preference_canonical_keys",
    "coerce_extension_value",
    "get_preferences_dict_for_user",
    "get_preferences_dict_optional",
    "get_preferences_updated_at",
    "merge_extended_buyer_preferences",
    "normalize_stored_document",
    "user_has_preferences",
]
