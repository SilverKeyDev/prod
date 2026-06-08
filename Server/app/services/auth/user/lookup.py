"""
User lookup utilities for authentication.
"""

from datetime import datetime, timezone

from flask import current_app
from sqlalchemy import text

from app import db
from app.models import User

from .user_fetch import (
    fetch_user_by_cognito_id,
    fetch_user_by_email,
    link_cognito_id_for_email,
    touch_user_last_login,
)


def find_or_create_user_by_cognito(
    cognito_id: str, email: str, update_last_login: bool = True
) -> User | None:
    """
    Find user by cognito_id, with fallback to email lookup.
    Updates last_logged_in if user is found.
    Returns User or None.
    """
    try:
        user = fetch_user_by_cognito_id(cognito_id)
        if not user:
            # Fallback: try to find by email
            user = fetch_user_by_email(email)
            if user:
                link_cognito_id_for_email(email, cognito_id)
                user = fetch_user_by_cognito_id(cognito_id) or fetch_user_by_email(email)

        if not user:
            now = datetime.now(timezone.utc)
            display_name = email.split("@", 1)[0].replace("+", " ").title()
            db.session.execute(
                text(
                    """
                    INSERT INTO users (
                        id, cognito_id, email, name, is_active,
                        created_at, updated_at, last_logged_in
                    ) VALUES (
                        :id, :cognito_id, :email, :name, true,
                        :now, :now, :now
                    )
                    ON CONFLICT (email) DO UPDATE SET
                        cognito_id = EXCLUDED.cognito_id,
                        updated_at = EXCLUDED.updated_at
                    """
                ),
                {
                    "id": cognito_id,
                    "cognito_id": cognito_id,
                    "email": email,
                    "name": display_name,
                    "now": now,
                },
            )
            db.session.commit()
            user = fetch_user_by_cognito_id(cognito_id) or fetch_user_by_email(email)

        if user and update_last_login:
            touch_user_last_login(str(user.id))
            user = fetch_user_by_cognito_id(cognito_id) or fetch_user_by_email(email) or user

        return user
    except Exception as e:
        current_app.logger.error(f"Error during user lookup: {str(e)}")
        return None
