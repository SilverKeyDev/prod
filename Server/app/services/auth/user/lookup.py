"""
User lookup utilities for authentication.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import User
from logger import log


def _fallback_name_from_email(email: str) -> str:
    local_part = email.split("@", 1)[0].strip()
    return local_part or "SilverKey User"


def find_or_create_user_by_cognito(
    cognito_id: str, email: str, name: str | None = None, update_last_login: bool = True
) -> User | None:
    """
    Find user by cognito_id, with fallback to email lookup.
    Updates last_logged_in if user is found.
    Returns User or None.
    """
    try:
        user = db.session.scalar(select(User).where(User.cognito_id == cognito_id))
        if not user:
            user = db.session.scalar(select(User).where(User.email == email))
            if user:
                user.cognito_id = cognito_id
                db.session.commit()
        now = datetime.now(timezone.utc)
        if not user and email:
            user = User(
                cognito_id=cognito_id,
                email=email,
                name=(name or "").strip() or _fallback_name_from_email(email),
                created_at=now,
                updated_at=now,
                last_logged_in=now if update_last_login else None,
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
        if user and update_last_login:
            user.last_logged_in = now
            db.session.commit()
        return user
    except Exception as e:
        log.error("ERRORS", f"Error during user lookup: {str(e)}")
        return None
