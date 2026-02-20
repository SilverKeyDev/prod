"""
Permission checking and management for Google Calendar
"""

from .constants import permissions
from .helpers import (
    check_multiple_permissions,
    check_permission,
    get_missing_permissions,
    get_permission_scope_map,
    get_scopes_from_tokeninfo,
    parse_scopes_to_permissions,
    require_permission,
    update_token_permissions_from_scopes,
)

# Backward-compatible exports for existing code
# These are derived from the single permissions dict
PERMISSIONS = {perm_name: perm_data["field_name"] for perm_name, perm_data in permissions.items()}
PERMISSION_SCOPE_MAP = {
    perm_name: perm_data["scope_url"] for perm_name, perm_data in permissions.items()
}
PERMISSION_DESCRIPTIONS = {
    perm_name: perm_data["description"] for perm_name, perm_data in permissions.items()
}

__all__ = [
    "permissions",
    "PERMISSIONS",  # Backward compatibility
    "PERMISSION_SCOPE_MAP",  # Backward compatibility
    "PERMISSION_DESCRIPTIONS",  # Backward compatibility
    "parse_scopes_to_permissions",
    "update_token_permissions_from_scopes",
    "check_permission",
    "require_permission",
    "get_missing_permissions",
    "get_permission_scope_map",
    "check_multiple_permissions",
    "get_scopes_from_tokeninfo",
]
