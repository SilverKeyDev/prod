from sqlalchemy import select


def test_find_or_create_user_by_cognito_creates_missing_local_user(app, db_session):
    from app.models import User
    from app.services.auth.user.lookup import find_or_create_user_by_cognito

    with app.app_context():
        user = find_or_create_user_by_cognito(
            "cognito-sub-existing", "existing@example.com", name="Existing User"
        )

        assert user is not None
        assert user.cognito_id == "cognito-sub-existing"
        assert user.email == "existing@example.com"
        assert user.name == "Existing User"
        assert user.is_active is True
        assert user.last_logged_in is not None

        stored = db_session.session.scalar(
            select(User).where(User.cognito_id == "cognito-sub-existing")
        )
        assert stored is not None
        assert stored.email == "existing@example.com"


def test_find_or_create_user_by_cognito_uses_email_fallback_name(app):
    from app.services.auth.user.lookup import find_or_create_user_by_cognito

    with app.app_context():
        user = find_or_create_user_by_cognito("cognito-sub-fallback", "fallback@example.com")

        assert user is not None
        assert user.name == "fallback"
