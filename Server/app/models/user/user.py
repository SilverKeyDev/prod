import uuid
from datetime import datetime

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cognito_id = db.Column(
        db.String(36), unique=True, nullable=True
    )  # Made nullable for Google OAuth users
    google_id = db.Column(db.String(255), unique=True, nullable=True)  # Google OAuth ID
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_logged_in = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Agent specific (deprecated when Phase 4: move to user_roles / role-specific tables)
    is_agent = db.Column(db.Boolean, default=False)
    client_ids = db.Column(db.Text)  # array of ids of clients
    mls_id = db.Column(db.String(100), nullable=True)
    brokerage = db.Column(db.String(200), nullable=True)

    # Buyer specific (deprecated when Phase 4: move to user_roles / user_tasks)
    agent_id = db.Column(db.Text)  # array of ids of agents for buyer
    has_preferences = db.Column(db.Boolean, default=False)
    preferences_version = db.Column(db.String(10), nullable=True)
    # New profile/roles/tasks/events (backref from child models; keep until Phase 4 then remove legacy above):
    # user_roles, user_demographics, user_financials, user_search_intent, user_intent_attributes,
    # user_important_locations, user_communication_prefs, user_calendar_connections, user_tasks
    # Checklist columns (deprecated when Phase 4: replaced by user_tasks)
    inspections_checklist = db.Column(db.Text)  # array of ids of inspections
    closing_checklist = db.Column(db.Text)  # array of ids of closings
    timeline_checklist = db.Column(db.Text)  # array of ids of timelines
    financing_checklist = db.Column(db.Text)  # array of ids of financings
    escrow_checklist = db.Column(db.Text)  # array of ids of escrows
    insurance_checklist = db.Column(db.Text)  # array of ids of insurance tasks

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "profile_picture": self.profile_picture,
            "mls_id": self.mls_id,
            "brokerage": self.brokerage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_logged_in": self.last_logged_in.isoformat() if self.last_logged_in else None,
            "is_active": self.is_active,
            "has_preferences": self.has_preferences,
            "is_agent": self.is_agent,
            "client_ids": self.client_ids,
            "agent_id": self.agent_id,
        }
