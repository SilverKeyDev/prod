import uuid
from datetime import datetime, timezone

from sqlalchemy import event
from sqlalchemy.orm import Mapped, mapped_column

from app import db


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    cognito_id: Mapped[str | None] = mapped_column(
        db.String(36), unique=True
    )  # Made nullable for Google OAuth users
    google_id: Mapped[str | None] = mapped_column(db.String(255), unique=True)  # Google OAuth ID
    email: Mapped[str] = mapped_column(db.String(120), unique=True)
    name: Mapped[str] = mapped_column(db.String(100))
    phone: Mapped[str | None] = mapped_column(db.String(20))
    profile_picture: Mapped[str | None] = mapped_column(db.String(500))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    last_logged_in: Mapped[datetime | None] = mapped_column(db.DateTime)
    is_active: Mapped[bool | None] = mapped_column(db.Boolean, default=True)

    mls_id: Mapped[str | None] = mapped_column(db.String(100))
    #: Unique slug for short public profile URLs (`/a/{slug}`); agents only.
    public_profile_slug: Mapped[str | None] = mapped_column(db.String(64), unique=True)

    has_preferences: Mapped[bool | None] = mapped_column(db.Boolean, default=False)
    preferences_version: Mapped[str | None] = mapped_column(db.String(10))

    def __init__(self, **kwargs):
        init_is_agent = kwargs.pop("is_agent", None)
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
        if init_is_agent is not None:
            self._init_is_agent = bool(init_is_agent)

    @property
    def is_agent(self) -> bool:
        from app.services.auth.user_role_helpers import user_is_agent

        return user_is_agent(self)

    @is_agent.setter
    def is_agent(self, value: bool) -> None:
        from app.services.auth.user_role_helpers import set_user_is_agent

        set_user_is_agent(str(self.id), bool(value))


@event.listens_for(User, "after_insert")
def _user_apply_init_agent_role(_mapper, connection, target) -> None:
    if not getattr(target, "_init_is_agent", False):
        return
    import uuid
    from datetime import datetime, timezone

    from sqlalchemy import text

    connection.execute(
        text(
            "INSERT INTO user_roles (id, user_id, role, created_at) "
            "VALUES (:id, :uid, 'agent', :created_at) "
            "ON CONFLICT DO NOTHING"
        ),
        {
            "id": str(uuid.uuid4()),
            "uid": str(target.id),
            "created_at": datetime.now(timezone.utc),
        },
    )
