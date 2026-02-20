"""Financial profile (queried a lot). Indexes: (home_budget_min, home_budget_max), credit_score_range in migration."""

from datetime import datetime

from app import db


class UserFinancials(db.Model):
    __tablename__ = "user_financials"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    gross_income = db.Column(db.Float, nullable=True)
    home_budget_min = db.Column(db.Float, nullable=True)
    home_budget_max = db.Column(db.Float, nullable=True)
    credit_score_range = db.Column(db.String(20), nullable=True)
    down_payment = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    user = db.relationship(
        "User", backref=db.backref("user_financials", uselist=False, lazy="select")
    )
