"""
Permission checking helpers for Google Calendar operations
Provides utilities for checking and validating OAuth permissions
"""

import requests

from app.services.auth.tokens import tokens_get
from logger import log

from .constants import permissions

TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"
_GOOGLE_OIDC_SHORT_TO_CANONICAL: dict[str, str] = {
    "email": permissions["userinfo_email"]["scope_url"],
    "profile": permissions["userinfo_profile"]["scope_url"],
}


def normalize_google_oauth_scope_list(scope_tokens: list[str]) -> list[str]:
    """Map OIDC short names to canonical scope URLs and dedupe (order preserved)."""
    seen: set[str] = set()
    out: list[str] = []
    for raw in scope_tokens:
        s = raw.strip()
        if not s:
            continue
        canonical = _GOOGLE_OIDC_SHORT_TO_CANONICAL.get(s, s)
        if canonical not in seen:
            seen.add(canonical)
            out.append(canonical)
    return out


def normalize_google_oauth_scope_string(scopes: str) -> str:
    """Normalize a space-separated scope string from tokeninfo or token responses."""
    if not scopes or not scopes.strip():
        return ""
    parts = normalize_google_oauth_scope_list(scopes.split())
    return " ".join(parts)


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
        log.warn("CALENDAR", "Cannot get scopes from tokeninfo: access_token is empty")
        return None
    try:
        response = requests.get(
            TOKENINFO_ENDPOINT, params={"access_token": access_token}, timeout=10
        )
        if response.status_code != 200:
            log.warn(
                "CALENDAR",
                f"Tokeninfo endpoint returned status {response.status_code}: {response.text[:200]}",
            )
            return None
        token_info = response.json()
        scopes = token_info.get("scope", "")
        normalized = normalize_google_oauth_scope_string(scopes)
        log.info("CALENDAR", f"Retrieved scopes from tokeninfo: {normalized}")
        return normalized
    except requests.exceptions.RequestException as e:
        log.warn("CALENDAR", f"Failed to call tokeninfo endpoint: {str(e)}")
        return None
    except (ValueError, KeyError) as e:
        log.warn("CALENDAR", f"Failed to parse tokeninfo response: {str(e)}")
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
    scope_list = normalize_google_oauth_scope_list(
        [s.strip() for s in scopes.split() if s.strip()]
        if isinstance(scopes, str)
        else [str(s).strip() for s in scopes if s]
    )
    scope_set = set(scope_list)
    result = {}
    for perm_name, perm_data in permissions.items():
        scope_url = perm_data["scope_url"]
        implied_by = perm_data.get("implied_by", [])
        if scope_url in scope_set:
            result[perm_name] = True
        elif implied_by and any(b in scope_set for b in implied_by):
            result[perm_name] = True
        else:
            result[perm_name] = False
    return result


def check_permission(user_id: str, permission: str) -> bool:
    """Check if user has specific permission

    Args:
        user_id: User ID
        permission: Permission name (e.g., 'calendar_freebusy')

    Returns:
        True if user has permission, False otherwise
    """
    if permission not in permissions:
        log.warn("CALENDAR", f"Unknown permission: {permission}")
        return False
    token_data = tokens_get(user_id)
    if not token_data:
        return False
    permission_field = permissions[permission].get("field_name")
    if not permission_field:
        scope_url = permissions[permission]["scope_url"]
        raw = token_data.get("scopes") or ""
        scope_list = normalize_google_oauth_scope_list(
            [s.strip() for s in raw.split() if s.strip()]
        )
        return scope_url in set(scope_list)
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
    perm_data = permissions.get(permission, {})
    perm_data.get("scope_url", "")
    description = perm_data.get("description", "")
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


def _build_reconnect_url(_permission: str) -> str:
    """Build OAuth reconnect URL for requesting calendar permissions.

    All permissions use the same authorize URL; incremental scopes are determined
    server-side (full Calendar is never requested).
    """
    return "/api/v1/google/oauth/start"


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
    missing_descriptions = [permissions.get(perm, {}).get("description", perm) for perm in missing]
    reconnect_url = _build_reconnect_url(missing[0]) if missing else "/api/v1/google/oauth/start"
    error_response = {
        "success": False,
        "error": "permission_required",
        "message": f"To {context}, you need to grant the following permissions: {', '.join(missing_descriptions)}. Please reconnect your Google Calendar account.",
        "required_permissions": missing,
        "reconnect_url": reconnect_url,
        "missing_permissions": missing,
    }
    return (False, error_response)
