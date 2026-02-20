"""
User lookup utilities for authentication.
"""

from datetime import datetime

from flask import current_app

from app import db
from app.models import User


def find_or_create_user_by_cognito(
    cognito_id: str, email: str, update_last_login: bool = True
) -> User | None:
    """
    Find user by cognito_id, with fallback to email lookup.
    Updates last_logged_in if user is found.
    Returns User or None.
    """
    try:
        user = User.query.filter_by(cognito_id=cognito_id).first()
        if not user:
            # Fallback: try to find by email
            user = User.query.filter_by(email=email).first()
            if user:
                # Link cognito_id to existing user
                user.cognito_id = cognito_id
                db.session.commit()

        # Update last_logged_in timestamp
        if user and update_last_login:
            user.last_logged_in = datetime.utcnow()
            db.session.commit()

        return user
    except Exception as e:
        current_app.logger.error(f"Error during user lookup: {str(e)}")
        return None
