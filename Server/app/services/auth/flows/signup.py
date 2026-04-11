"""
User signup flow handler.
"""

from datetime import datetime, timezone
from typing import Any

from flask import current_app

from app import db
from app.models import User

from ..core.cognito_service import AWS_COGNITO_service


def handle_signup(data: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """
    Handle user signup flow.
    Returns (response_dict, status_code).
    """
    user_attributes = [
        {"Name": "email", "Value": data["email"]},
        {"Name": "name", "Value": data["name"]},
    ]

    if "phone" in data:
        user_attributes.append({"Name": "phone_number", "Value": data["phone"]})

    result = AWS_COGNITO_service.sign_up(
        username=data["email"], password=data["password"], user_attributes=user_attributes
    )

    if not result["success"]:
        return {
            "success": False,
            "error": result.get("error", "SIGNUP_FAILED"),
            "message": result.get("message", "Failed to register user"),
        }, 400

    # Create user in database (non-blocking)
    try:
        now = datetime.now(timezone.utc)
        user = User(
            id=result["user_sub"],
            cognito_id=result["user_sub"],
            email=data["email"],
            name=data["name"],
            phone=data.get("phone"),
            brokerage=(str(data["brokerage"]).strip() if data.get("brokerage") else None),
            created_at=now,
            updated_at=now,
            last_logged_in=now,
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error creating user in database: {str(e)}")
        # Don't fail signup if DB creation fails

    return {
        "success": True,
        "message": "User registered successfully. Please check your email for verification code.",
        "user_sub": result["user_sub"],
    }, 201
