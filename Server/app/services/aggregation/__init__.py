"""
Aggregation services: preferences aggregation and report comparison helpers.
"""

from app.services.aggregation.preferences_aggregation import (
    get_preferences_dict_for_user,
    get_preferences_dict_optional,
    get_preferences_updated_at,
    user_has_preferences,
    write_preferences_from_payload,
)
from app.services.aggregation.report_comparator import _download_json_from_s3

__all__ = [
    "_download_json_from_s3",
    "get_preferences_dict_for_user",
    "get_preferences_dict_optional",
    "get_preferences_updated_at",
    "user_has_preferences",
    "write_preferences_from_payload",
]
