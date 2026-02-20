"""
Share a calendar with multiple users.
"""

from app.utils.security.app_logging import get_logger
from app.utils.security.security import sanitize_error_message

from ..core.credentials import load_credentials
from .sharing import add_calendar_acl

logger = get_logger()


def share_calendar_with_users(
    calendar_owner_id: str,
    shared_with_user_ids: list[str],
    calendar_id: str,
    role: str = "writer",
    client_id_oauth: str | None = None,
    client_secret: str | None = None,
    token_endpoint: str | None = None,
    scopes: list | None = None,
    get_or_create_silverkey_calendar_func=None,
    db_session=None,
) -> dict:
    """Share a calendar with multiple users

    Args:
        calendar_owner_id: User ID who owns the calendar
        shared_with_user_ids: List of user IDs to share the calendar with
        calendar_id: Calendar ID to share
        role: ACL role ("reader", "writer", "owner")
        client_id_oauth: Google OAuth client ID
        client_secret: Google OAuth client secret
        token_endpoint: OAuth token endpoint
        scopes: Default scopes list
        get_or_create_silverkey_calendar_func: Function to get or create SilverKey calendar
        db_session: Database session

    Returns:
        Dictionary with status and results
    """
    if db_session is None:
        from app import db

        db_session = db.session

    from app.models import User
    from app.models.calendar.calendar_share import CalendarShare

    result = {"success": True, "shared_with": [], "errors": []}

    try:
        owner = User.query.filter_by(id=calendar_owner_id).first()
        if not owner:
            result["errors"].append(f"Calendar owner {calendar_owner_id} not found")
            result["success"] = False
            return result

        shared_users = User.query.filter(User.id.in_(shared_with_user_ids)).all()
        user_email_map = {user.id: user.email for user in shared_users}

        for shared_user_id in shared_with_user_ids:
            if shared_user_id not in user_email_map:
                result["errors"].append(f"User {shared_user_id} not found")
                continue

            shared_user_email = user_email_map[shared_user_id]

            try:
                existing_share = CalendarShare.query.filter_by(
                    calendar_owner_id=calendar_owner_id,
                    shared_with_user_id=shared_user_id,
                    calendar_id=calendar_id,
                ).first()

                if existing_share:
                    result["shared_with"].append(shared_user_id)
                    logger.info(f"Calendar {calendar_id} already shared with user {shared_user_id}")
                    continue

                if client_id_oauth and client_secret and token_endpoint and scopes:
                    try:
                        creds = load_credentials(
                            calendar_owner_id,
                            client_id_oauth or "",
                            client_secret or "",
                            token_endpoint or "",
                            scopes or [],
                        )
                        from googleapiclient.discovery import build

                        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

                        existing_acls = service.acl().list(calendarId=calendar_id).execute()
                        acl_exists = any(
                            rule.get("scope", {}).get("value") == shared_user_email
                            for rule in existing_acls.get("items", [])
                        )

                        if not acl_exists:
                            add_calendar_acl(
                                calendar_owner_id,
                                calendar_id,
                                shared_user_email,
                                role,
                                client_id_oauth or "",
                                client_secret or "",
                                token_endpoint or "",
                                scopes or [],
                            )
                    except Exception as e:
                        error_msg = sanitize_error_message(e)
                        result["errors"].append(
                            f"Failed to set up ACL for user {shared_user_id}: {error_msg}"
                        )
                        logger.error(f"Error setting up ACL: {error_msg}", exc_info=True)

                try:
                    calendar_share = CalendarShare(
                        calendar_owner_id=calendar_owner_id,
                        shared_with_user_id=shared_user_id,
                        calendar_id=calendar_id,
                        role=role,
                    )
                    db_session.add(calendar_share)
                    result["shared_with"].append(shared_user_id)
                    logger.info(f"Shared calendar {calendar_id} with user {shared_user_id}")
                except Exception as db_error:
                    error_str = str(db_error).lower()
                    if (
                        "unique" in error_str
                        or "constraint" in error_str
                        or "duplicate" in error_str
                    ):
                        result["shared_with"].append(shared_user_id)
                        logger.info(
                            f"Calendar {calendar_id} already shared with user {shared_user_id} (race condition handled)"
                        )
                    else:
                        raise

            except Exception as e:
                error_msg = sanitize_error_message(e)
                result["errors"].append(f"Failed to share with user {shared_user_id}: {error_msg}")
                logger.error(
                    f"Error sharing calendar with user {shared_user_id}: {error_msg}", exc_info=True
                )

        try:
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            error_msg = sanitize_error_message(e)
            result["errors"].append(f"Failed to commit calendar shares: {error_msg}")
            logger.error(f"Error committing calendar shares: {error_msg}", exc_info=True)
            result["success"] = False
            return result

        if result["errors"] and not result["shared_with"]:
            result["success"] = False
        elif result["shared_with"]:
            result["success"] = True

        return result

    except Exception as e:
        db_session.rollback()
        error_msg = sanitize_error_message(e)
        result["errors"].append(f"Unexpected error: {error_msg}")
        result["success"] = False
        logger.error(
            f"Unexpected error sharing calendar with multiple users: {error_msg}", exc_info=True
        )
        return result
