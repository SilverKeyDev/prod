import uuid
import warnings
from datetime import datetime, timezone

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

    # Agent specific (deprecated when Phase 4: move to user_roles / role-specific tables)
    is_agent: Mapped[bool | None] = mapped_column(db.Boolean, default=False)
    client_ids: Mapped[str | None] = mapped_column(db.Text)  # array of ids of clients
    mls_id: Mapped[str | None] = mapped_column(db.String(100))
    brokerage: Mapped[str | None] = mapped_column(db.String(200))
    #: Unique slug for short public profile URLs (`/a/{slug}`); agents only.
    public_profile_slug: Mapped[str | None] = mapped_column(db.String(64), unique=True)

    # Buyer specific (deprecated when Phase 4: move to user_roles / user_tasks)
    agent_id: Mapped[str | None] = mapped_column(db.Text)  # array of ids of agents for buyer
    has_preferences: Mapped[bool | None] = mapped_column(db.Boolean, default=False)
    preferences_version: Mapped[str | None] = mapped_column(db.String(10))
    # New profile/roles/tasks/events (backref from child models; keep until Phase 4 then remove legacy above):
    # user_roles, user_demographics, user_financials, user_search_intent, user_intent_attributes,
    # user_important_locations, user_communication_prefs, user_calendar_connections, user_tasks
    # Checklist columns (deprecated when Phase 4: replaced by user_tasks)
    inspections_checklist: Mapped[str | None] = mapped_column(
        db.Text
    )  # array of ids of inspections
    closing_checklist: Mapped[str | None] = mapped_column(db.Text)  # array of ids of closings
    timeline_checklist: Mapped[str | None] = mapped_column(db.Text)  # array of ids of timelines
    financing_checklist: Mapped[str | None] = mapped_column(db.Text)  # array of ids of financings
    escrow_checklist: Mapped[str | None] = mapped_column(db.Text)  # array of ids of escrows
    insurance_checklist: Mapped[str | None] = mapped_column(
        db.Text
    )  # array of ids of insurance tasks

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        warnings.warn(
            "User.to_dict() is deprecated; use app.dtos.user.UserDTO.to_response",
            DeprecationWarning,
            stacklevel=2,
        )

        def _iso_utc(dt: datetime | None) -> str | None:
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()

        return {
            "id": self.id,
            "cognito_id": self.cognito_id,
            "google_id": self.google_id,
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "profile_picture": self.profile_picture,
            "mls_id": self.mls_id,
            "brokerage": self.brokerage,
            "created_at": _iso_utc(self.created_at),
            "updated_at": _iso_utc(self.updated_at),
            "last_logged_in": _iso_utc(self.last_logged_in),
            "is_active": self.is_active if self.is_active is not None else True,
            "has_preferences": self.has_preferences,
            "preferences_version": self.preferences_version,
            "is_agent": self.is_agent if self.is_agent is not None else False,
            "client_ids": self.client_ids,
            "agent_id": self.agent_id,
        }
