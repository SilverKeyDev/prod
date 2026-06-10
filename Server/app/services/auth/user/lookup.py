"""
User lookup utilities for authentication.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import User
from logger import log


def find_or_create_user_by_cognito(
    cognito_id: str, email: str, update_last_login: bool = True
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
        if user and update_last_login:
            user.last_logged_in = datetime.now(timezone.utc)
            db.session.commit()
        return user
    except Exception as e:
        log.error("ERRORS", f"Error during user lookup: {str(e)}")
        return None
