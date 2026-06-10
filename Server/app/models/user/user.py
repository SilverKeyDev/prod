# pyright: reportUndefinedVariable=false
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import DynamicMapped, Mapped, mapped_column, relationship

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
    active_transaction_id: Mapped[str | None] = mapped_column(
        db.String(36),
        db.ForeignKey("transactions.id", ondelete="SET NULL", use_alter=True),
        index=True,
    )

    google_oauth_token: Mapped["GoogleOAuthToken | None"] = relationship(
        "GoogleOAuthToken",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_financials: Mapped["UserFinancials | None"] = relationship(
        "UserFinancials",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_demographics: Mapped["UserDemographics | None"] = relationship(
        "UserDemographics",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_client_settings: Mapped["UserClientSettings | None"] = relationship(
        "UserClientSettings",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_communication_prefs: Mapped["UserCommunicationPrefs | None"] = relationship(
        "UserCommunicationPrefs",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_search_intent: Mapped["UserSearchIntent | None"] = relationship(
        "UserSearchIntent",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_search_display: Mapped["UserSearchDisplaySettings | None"] = relationship(
        "UserSearchDisplaySettings",
        back_populates="user",
        uselist=False,
        lazy="select",
        cascade="all, delete-orphan",
        single_parent=True,
    )
    user_agent_profile: Mapped["UserAgentProfile | None"] = relationship(
        "UserAgentProfile",
        back_populates="user",
        uselist=False,
        lazy="select",
    )
    user_calendar_connections: DynamicMapped["UserCalendarConnection"] = relationship(
        "UserCalendarConnection",
        back_populates="user",
        lazy="dynamic",
    )
    user_intent_attributes: DynamicMapped["UserIntentAttribute"] = relationship(
        "UserIntentAttribute",
        back_populates="user",
        lazy="dynamic",
    )
    user_important_locations: DynamicMapped["UserImportantLocation"] = relationship(
        "UserImportantLocation",
        back_populates="user",
        lazy="dynamic",
    )
    user_roles: DynamicMapped["UserRole"] = relationship(
        "UserRole",
        back_populates="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="user",
        lazy=True,
    )
    docusign_token: Mapped["DocusignOAuthToken | None"] = relationship(
        "DocusignOAuthToken",
        back_populates="user",
        uselist=False,
    )
    agent_conversations: Mapped[list["AgentConnections"]] = relationship(
        "AgentConnections",
        foreign_keys="AgentConnections.agent_id",
        back_populates="agent",
        lazy=True,
    )
    client_conversations: Mapped[list["AgentConnections"]] = relationship(
        "AgentConnections",
        foreign_keys="AgentConnections.client_id",
        back_populates="client",
        lazy=True,
    )
    sent_agent_requests: Mapped[list["AgentConnectionRequest"]] = relationship(
        "AgentConnectionRequest",
        foreign_keys="AgentConnectionRequest.agent_id",
        back_populates="agent",
        lazy=True,
    )
    received_agent_requests: Mapped[list["AgentConnectionRequest"]] = relationship(
        "AgentConnectionRequest",
        foreign_keys="AgentConnectionRequest.client_id",
        back_populates="client",
        lazy=True,
    )
    todos: Mapped[list["Todo"]] = relationship(
        "Todo",
        foreign_keys="Todo.agent_id",
        back_populates="agent",
        lazy=True,
    )
    client_todos: Mapped[list["Todo"]] = relationship(
        "Todo",
        foreign_keys="Todo.client_id",
        back_populates="client",
        lazy=True,
    )
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(
        "CalendarEvent",
        foreign_keys="CalendarEvent.user_id",
        back_populates="user",
        lazy=True,
    )
    created_events: Mapped[list["CalendarEvent"]] = relationship(
        "CalendarEvent",
        foreign_keys="CalendarEvent.creator_id",
        back_populates="creator",
        lazy=True,
    )
    target_calendar_events: Mapped[list["CalendarEvent"]] = relationship(
        "CalendarEvent",
        foreign_keys="CalendarEvent.target_user_id",
        back_populates="target_user",
        lazy=True,
    )
    shared_calendars: Mapped[list["CalendarShare"]] = relationship(
        "CalendarShare",
        foreign_keys="CalendarShare.calendar_owner_id",
        back_populates="calendar_owner",
        lazy=True,
    )
    calendars_shared_with_me: Mapped[list["CalendarShare"]] = relationship(
        "CalendarShare",
        foreign_keys="CalendarShare.shared_with_user_id",
        back_populates="shared_with_user",
        lazy=True,
    )
    org_memberships: DynamicMapped["UserOrgMembership"] = relationship(
        "UserOrgMembership",
        back_populates="user",
        lazy="dynamic",
    )
    user_tasks: DynamicMapped["TransactionTask"] = relationship(
        "TransactionTask",
        back_populates="user",
        lazy="dynamic",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())
