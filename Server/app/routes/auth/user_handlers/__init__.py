"""User route handlers."""

from .checklists import close_checklist, timeline_checklist
from .favorites import add_favorite_home, favorite_homes, remove_favorite_home
from .not_interested import (
    add_not_interested_home,
    not_interested_homes,
    remove_not_interested_home,
    update_not_interested_home,
)
from .profile import get_user_profile, update_closing_mode, upload_profile_picture

__all__ = [
    "get_user_profile",
    "update_closing_mode",
    "upload_profile_picture",
    "timeline_checklist",
    "close_checklist",
    "favorite_homes",
    "add_favorite_home",
    "remove_favorite_home",
    "not_interested_homes",
    "add_not_interested_home",
    "remove_not_interested_home",
    "update_not_interested_home",
]
