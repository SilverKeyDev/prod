"""Update Google OAuth token model fields from granted scope strings."""

from logger import log

from .constants import permissions
from .google_calendar_oauth import normalize_google_oauth_scope_list


def update_token_permissions_from_scopes(token_record, scopes: str) -> None:
    """Update permission boolean fields on a token record from scope string

    This function updates the permission flags on a GoogleOAuthToken model instance
    based on the granted scopes. Uses exact matching to prevent false positives.

    Args:
        token_record: GoogleOAuthToken model instance to update
        scopes: Space-separated list of Google OAuth scopes (full URLs or short forms)
    """
    user_id = getattr(token_record, "user_id", "unknown")
    log.info(
        "CALENDAR",
        "PERMISSIONS_UPDATE_START",
        {
            "user_id": user_id,
            "raw_scopes_input": scopes,
            "scopes_type": type(scopes).__name__,
            "scopes_length": len(scopes) if scopes else 0,
        },
    )
    if not scopes:
        log.info(
            "CALENDAR",
            "PERMISSIONS_UPDATE_NO_SCOPES",
            {"user_id": user_id, "action": "reset_all_permissions_to_false"},
        )
        for perm_data in permissions.values():
            field = perm_data.get("field_name")
            if field:
                setattr(token_record, field, False)
        return
    scope_list = (
        [s.strip() for s in scopes.split() if s.strip()]
        if isinstance(scopes, str)
        else [str(s).strip() for s in scopes if s]
    )
    scope_list = normalize_google_oauth_scope_list(scope_list)
    scope_set = set(scope_list)
    log.info(
        "CALENDAR",
        "PERMISSIONS_UPDATE_PARSED_SCOPES",
        {
            "user_id": user_id,
            "scope_count": len(scope_set),
            "parsed_scopes": list(scope_set),
            "raw_scopes_string": scopes,
        },
    )
    permission_updates = {}

    def has_scope_or_implied(scope_url: str, implied_by: list | None = None) -> bool:
        """Check if scope exists in set using exact matching or broader scopes that imply it

        Args:
            scope_url: The exact scope URL to check
            implied_by: List of broader scope URLs that imply this permission

        Returns:
            True if exact scope or any broader scope is found
        """
        if scope_url in scope_set:
            return True
        if implied_by:
            for broader_scope in implied_by:
                if broader_scope in scope_set:
                    return True
        return False

    for perm_name, perm_data in permissions.items():
        permission_field = perm_data.get("field_name")
        if not permission_field:
            continue
        scope_url = perm_data["scope_url"]
        implied_by = perm_data.get("implied_by", [])
        has_permission = has_scope_or_implied(scope_url, implied_by)
        matched_scope = None
        if scope_url in scope_set:
            matched_scope = scope_url
        elif implied_by:
            for broader_scope in implied_by:
                if broader_scope in scope_set:
                    matched_scope = broader_scope
                    break
        setattr(token_record, permission_field, has_permission)
        permission_updates[perm_name] = {
            "granted": has_permission,
            "scope_url": scope_url,
            "matched_scope": matched_scope,
            "implied_by_checked": implied_by if implied_by else [],
        }
    final_permissions = {
        perm_data["field_name"]: getattr(token_record, perm_data["field_name"], False)
        for perm_data in permissions.values()
        if perm_data.get("field_name")
    }
    log.info(
        "CALENDAR",
        "PERMISSIONS_UPDATE_COMPLETE",
        {
            "user_id": user_id,
            "raw_scopes_input": scopes,
            "parsed_scope_count": len(scope_set),
            "parsed_scopes": list(scope_set),
            "permission_updates": permission_updates,
            "final_permissions": final_permissions,
        },
    )
