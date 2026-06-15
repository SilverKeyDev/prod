"""Load User rows when legacy columns (e.g. is_agent) are absent from the physical schema."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import attributes, load_only

from app import db
from app.models import User, UserRole

# Columns present on production RDS users table (2026-06); omit legacy flags not yet migrated.
_AUTH_USER_COLUMNS: tuple[str, ...] = (
    "id",
    "cognito_id",
    "google_id",
    "email",
    "name",
    "phone",
    "profile_picture",
    "created_at",
    "updated_at",
    "last_logged_in",
    "is_active",
    "has_preferences",
    "preferences_version",
    "mls_id",
    "public_profile_slug",
)


def _role_names_for_user_id(user_id: str) -> list[str]:
    return list(db.session.scalars(select(UserRole.role).where(UserRole.user_id == user_id)).all())


def _hydrate_legacy_user_fields(user: User) -> None:
    """Prevent lazy SELECT of dropped legacy columns; derive flags from user_roles when mapped."""
    mapper_attrs = User.__mapper__.attrs
    roles = _role_names_for_user_id(str(user.id))
    role_set = {r.strip().lower() for r in roles if isinstance(r, str)}
    legacy_values = {
        "is_agent": "agent" in role_set,
        "client_ids": None,
        "agent_id": None,
        "brokerage": None,
    }
    for attr, value in legacy_values.items():
        if attr in mapper_attrs:
            attributes.set_committed_value(user, attr, value)


def _load_only_options():
    return load_only(*[getattr(User, name) for name in _AUTH_USER_COLUMNS])


def fetch_user_by_id(user_id: str) -> User | None:
    user = User.query.options(_load_only_options()).filter_by(id=user_id).first()
    if user is not None:
        _hydrate_legacy_user_fields(user)
    return user


def fetch_user_by_email(email: str) -> User | None:
    user = User.query.options(_load_only_options()).filter_by(email=email).first()
    if user is not None:
        _hydrate_legacy_user_fields(user)
    return user


def fetch_user_by_cognito_id(cognito_id: str) -> User | None:
    user = User.query.options(_load_only_options()).filter_by(cognito_id=cognito_id).first()
    if user is not None:
        _hydrate_legacy_user_fields(user)
    return user


def link_cognito_id_for_email(email: str, cognito_id: str) -> None:
    """Update cognito_id without ORM flush of legacy columns absent from the physical schema."""
    from datetime import datetime, timezone

    from sqlalchemy import text

    db.session.execute(
        text(
            """
            UPDATE users
            SET cognito_id = :cognito_id, updated_at = :now
            WHERE email = :email
            """
        ),
        {"cognito_id": cognito_id, "email": email, "now": datetime.now(timezone.utc)},
    )
    db.session.commit()


def touch_user_last_login(user_id: str) -> None:
    from datetime import datetime, timezone

    from sqlalchemy import text

    db.session.execute(
        text(
            """
            UPDATE users
            SET last_logged_in = :now, updated_at = :now
            WHERE id = :user_id
            """
        ),
        {"user_id": user_id, "now": datetime.now(timezone.utc)},
    )
    db.session.commit()
