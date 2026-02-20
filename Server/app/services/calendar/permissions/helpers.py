"""
Permission checking helpers for Google Calendar operations
Provides utilities for checking and validating OAuth permissions
"""

import requests

from app.services.auth.tokens import tokens_get
from app.utils.security.app_logging import get_logger

from .constants import permissions

logger = get_logger()

# Google OAuth tokeninfo endpoint - authoritative source for token scopes
TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"


def get_scopes_from_tokeninfo(access_token: str) -> str | None:
    """Get authoritative scopes from Google's tokeninfo endpoint

    This is the canonical source of truth for what scopes are actually
    embedded in the access token. Google does not provide an API to list
    all scopes a user granted - they are embedded in the token itself.

    Args:
        access_token: Google OAuth access token

    Returns:
        Space-separated string of scopes, or None if tokeninfo call fails

    Example response:
        {
          "issued_to": "YOUR_CLIENT_ID",
          "audience": "YOUR_CLIENT_ID",
          "scope": "openid email profile https://www.googleapis.com/auth/calendar.app.created",
          "expires_in": 3575,
          "access_type": "offline"
        }
    """
    if not access_token:
        logger.warning("Cannot get scopes from tokeninfo: access_token is empty")
        return None

    try:
        response = requests.get(
            TOKENINFO_ENDPOINT, params={"access_token": access_token}, timeout=10
        )

        if response.status_code != 200:
            logger.warning(
                f"Tokeninfo endpoint returned status {response.status_code}: {response.text[:200]}"
            )
            return None

        token_info = response.json()
        scopes = token_info.get("scope", "")

        logger.info(f"Retrieved scopes from tokeninfo: {scopes}")
        return scopes

    except requests.exceptions.RequestException as e:
        logger.warning(f"Failed to call tokeninfo endpoint: {str(e)}")
        return None
    except (ValueError, KeyError) as e:
        logger.warning(f"Failed to parse tokeninfo response: {str(e)}")
        return None


def parse_scopes_to_permissions(scopes: str) -> dict[str, bool]:
    """Parse space-separated scope string into permission dictionary

    Args:
        scopes: Space-separated list of Google OAuth scopes

    Returns:
        Dictionary mapping permission names to boolean values
    """
    if not scopes:
        return dict.fromkeys(permissions.keys(), False)

    scope_list = scopes.split() if isinstance(scopes, str) else scopes
    result = {}

    for perm_name, perm_data in permissions.items():
        result[perm_name] = perm_data["scope_url"] in scope_list

    return result


def update_token_permissions_from_scopes(token_record, scopes: str) -> None:
    """Update permission boolean fields on a token record from scope string

    This function updates the permission flags on a GoogleOAuthToken model instance
    based on the granted scopes. Uses exact matching to prevent false positives.

    Args:
        token_record: GoogleOAuthToken model instance to update
        scopes: Space-separated list of Google OAuth scopes (full URLs or short forms)
    """
    user_id = getattr(token_record, "user_id", "unknown")

    # Log raw input
    logger.info(
        "PERMISSIONS_UPDATE_START",
        extra={
            "user_id": user_id,
            "raw_scopes_input": scopes,
            "scopes_type": type(scopes).__name__,
            "scopes_length": len(scopes) if scopes else 0,
        },
    )

    if not scopes:
        # Reset all permissions to False if no scopes
        logger.info(
            "PERMISSIONS_UPDATE_NO_SCOPES",
            extra={"user_id": user_id, "action": "reset_all_permissions_to_false"},
        )
        # Reset all permissions dynamically
        for perm_data in permissions.values():
            setattr(token_record, perm_data["field_name"], False)
        return

    # Parse scopes into a set for O(1) lookup (normalize whitespace)
    scope_list = (
        [s.strip() for s in scopes.split() if s.strip()]
        if isinstance(scopes, str)
        else [str(s).strip() for s in scopes if s]
    )
    scope_set = set(scope_list)  # Use set for exact matching

    # Log parsed scopes
    logger.info(
        "PERMISSIONS_UPDATE_PARSED_SCOPES",
        extra={
            "user_id": user_id,
            "scope_count": len(scope_set),
            "parsed_scopes": list(scope_set),
            "raw_scopes_string": scopes,
        },
    )

    # Track permission updates for logging
    permission_updates = {}

    # Helper function to check for scope using exact matching and broader scopes
    def has_scope_or_implied(scope_url: str, implied_by: list | None = None) -> bool:
        """Check if scope exists in set using exact matching or broader scopes that imply it

        Args:
            scope_url: The exact scope URL to check
            implied_by: List of broader scope URLs that imply this permission

        Returns:
            True if exact scope or any broader scope is found
        """
        # Check exact match first
        if scope_url in scope_set:
            return True

        # Check broader scopes that imply this permission
        if implied_by:
            for broader_scope in implied_by:
                if broader_scope in scope_set:
                    return True

        return False

    # Map scopes to permission fields using permissions dict for consistency
    # Check both exact matches and broader scopes that imply permissions
    for perm_name, perm_data in permissions.items():
        permission_field = perm_data["field_name"]
        scope_url = perm_data["scope_url"]
        implied_by = perm_data.get("implied_by", [])

        # Check if scope exists using exact matching or broader scopes
        has_permission = has_scope_or_implied(scope_url, implied_by)

        # Determine which scope was matched for logging
        matched_scope = None
        if scope_url in scope_set:
            matched_scope = scope_url
        elif implied_by:
            for broader_scope in implied_by:
                if broader_scope in scope_set:
                    matched_scope = broader_scope
                    break

        # Update the permission field
        setattr(token_record, permission_field, has_permission)

        # Track for logging
        permission_updates[perm_name] = {
            "granted": has_permission,
            "scope_url": scope_url,
            "matched_scope": matched_scope,
            "implied_by_checked": implied_by if implied_by else [],
        }

    # Build final permissions dict dynamically
    final_permissions = {
        perm_data["field_name"]: getattr(token_record, perm_data["field_name"], False)
        for perm_data in permissions.values()
    }

    # Log full permission update results
    logger.info(
        "PERMISSIONS_UPDATE_COMPLETE",
        extra={
            "user_id": user_id,
            "raw_scopes_input": scopes,
            "parsed_scope_count": len(scope_set),
            "parsed_scopes": list(scope_set),
            "permission_updates": permission_updates,
            "final_permissions": final_permissions,
        },
    )


def check_permission(user_id: str, permission: str) -> bool:
    """Check if user has specific permission

    Args:
        user_id: User ID
        permission: Permission name (e.g., 'calendar_freebusy')

    Returns:
        True if user has permission, False otherwise
    """
    if permission not in permissions:
        logger.warning(f"Unknown permission: {permission}")
        return False

    token_data = tokens_get(user_id)
    if not token_data:
        return False

    # Check permission field in token data
    permission_field = permissions[permission]["field_name"]
    return token_data.get(permission_field, False)


def require_permission(
    user_id: str, permission: str, context: str = "this operation"
) -> tuple[bool, dict | None]:
    """Check permission and return error response if missing

    Args:
        user_id: User ID
        permission: Permission name (e.g., 'calendar_freebusy')
        context: Context description for error message (e.g., "query availability")

    Returns:
        Tuple of (has_permission, error_response_dict)
        If has_permission is True, error_response_dict is None
        If has_permission is False, error_response_dict contains error response
    """
    has_permission = check_permission(user_id, permission)

    if has_permission:
        return (True, None)

    # Build error response
    perm_data = permissions.get(permission, {})
    perm_data.get("scope_url", "")
    description = perm_data.get("description", "")

    # Determine reconnect URL based on permission
    reconnect_url = _build_reconnect_url(permission)

    error_response = {
        "success": False,
        "error": "permission_required",
        "message": f"To {context}, you need to grant permission: {description}. Please reconnect your Google Calendar account.",
        "required_permission": permission,
        "reconnect_url": reconnect_url,
        "missing_permissions": [permission],
    }

    return (False, error_response)


def get_missing_permissions(user_id: str, required_permissions: list[str]) -> list[str]:
    """Return list of missing permissions for a user

    Args:
        user_id: User ID
        required_permissions: List of permission names to check

    Returns:
        List of missing permission names
    """
    missing = []
    for permission in required_permissions:
        if not check_permission(user_id, permission):
            missing.append(permission)
    return missing


def get_permission_scope_map() -> dict[str, str]:
    """Get mapping of permission names to full Google scope URLs

    Returns:
        Dictionary mapping permission names to scope URLs
    """
    return {perm_name: perm_data["scope_url"] for perm_name, perm_data in permissions.items()}


def _build_reconnect_url(permission: str) -> str:
    """Build OAuth reconnect URL for requesting specific permission

    Args:
        permission: Permission name

    Returns:
        OAuth start URL with appropriate query parameters
    """
    base_url = "/api/v1/google-calendar/oauth/start"

    # Map permissions to OAuth URL parameters
    if permission == "calendar_freebusy":
        return f"{base_url}?scheduling=true"
    elif permission == "calendar_app_created":
        return f"{base_url}?full_scope=true"
    elif permission in ["calendar_calendarlist_readonly", "calendar_events_freebusy"]:
        # These might need special handling, for now use scheduling
        return f"{base_url}?scheduling=true"
    else:
        # Default to base OAuth start
        return base_url


def check_multiple_permissions(
    user_id: str, required_permissions: list[str], context: str = "this operation"
) -> tuple[bool, dict | None]:
    """Check multiple permissions and return error if any are missing

    Args:
        user_id: User ID
        required_permissions: List of permission names to check
        context: Context description for error message

    Returns:
        Tuple of (all_permissions_present, error_response_dict)
    """
    missing = get_missing_permissions(user_id, required_permissions)

    if not missing:
        return (True, None)

    # Build error response with all missing permissions
    missing_descriptions = [permissions.get(perm, {}).get("description", perm) for perm in missing]
    reconnect_url = (
        _build_reconnect_url(missing[0]) if missing else "/api/v1/google-calendar/oauth/start"
    )

    error_response = {
        "success": False,
        "error": "permission_required",
        "message": f"To {context}, you need to grant the following permissions: {', '.join(missing_descriptions)}. Please reconnect your Google Calendar account.",
        "required_permissions": missing,
        "reconnect_url": reconnect_url,
        "missing_permissions": missing,
    }

    return (False, error_response)
