"""Auth route handlers."""

from .google_oauth import google_oauth_callback, google_oauth_start
from .login import login
from .password import forgot_password, reset_password
from .preferences_action_plan import generate_client_action_plan
from .preferences_agents import get_agents, get_user_agents, remove_agent_relationship, set_as_agent
from .preferences_preferences import (
    create_or_update_preferences,
    get_clients_preferences,
    get_preferences,
    get_user_preferences_by_id,
)
from .search_display import get_search_display, patch_search_display
from .session import logout, refresh_token
from .signup_verify import resend_code, signup, verify
from .user_checklists import (
    get_close_checklist,
    get_timeline_checklist,
    put_close_checklist,
    put_timeline_checklist,
)
from .user_favorites import (
    add_favorite_home,
    get_favorite_homes,
    post_favorite_homes,
    remove_favorite_home,
)
from .user_not_interested import (
    add_not_interested_home,
    not_interested_homes,
    remove_not_interested_home,
    update_not_interested_home,
)
from .user_profile import get_user_profile, update_closing_mode, upload_profile_picture

__all__ = [
    "signup",
    "verify",
    "resend_code",
    "login",
    "forgot_password",
    "reset_password",
    "refresh_token",
    "logout",
    "google_oauth_start",
    "google_oauth_callback",
    "create_or_update_preferences",
    "get_preferences",
    "get_user_preferences_by_id",
    "get_clients_preferences",
    "get_agents",
    "set_as_agent",
    "get_user_agents",
    "remove_agent_relationship",
    "generate_client_action_plan",
    "get_search_display",
    "patch_search_display",
    "get_user_profile",
    "update_closing_mode",
    "upload_profile_picture",
    "get_timeline_checklist",
    "put_timeline_checklist",
    "get_close_checklist",
    "put_close_checklist",
    "get_favorite_homes",
    "post_favorite_homes",
    "add_favorite_home",
    "remove_favorite_home",
    "not_interested_homes",
    "add_not_interested_home",
    "remove_not_interested_home",
    "update_not_interested_home",
]
