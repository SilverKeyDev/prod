"""Search intent (changes often; drives ranking). Typed columns only; no JSON for queryable filters."""

from datetime import datetime

from app import db


class UserSearchIntent(db.Model):
    __tablename__ = "user_search_intent"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    housing_type = db.Column(db.String(100), nullable=True)
    preferred_bedrooms_min = db.Column(db.Integer, nullable=True)
    preferred_bedrooms_max = db.Column(db.Integer, nullable=True)
    preferred_bathrooms_min = db.Column(db.Integer, nullable=True)
    preferred_bathrooms_max = db.Column(db.Integer, nullable=True)
    preferred_sqft_min = db.Column(db.Integer, nullable=True)
    preferred_sqft_max = db.Column(db.Integer, nullable=True)
    preferred_lot_size_min = db.Column(db.Float, nullable=True)
    preferred_lot_size_max = db.Column(db.Float, nullable=True)
    preferred_home_age_max = db.Column(db.Integer, nullable=True)
    days_on_market_min = db.Column(db.Integer, nullable=True)
    days_on_market_max = db.Column(db.Integer, nullable=True)
    walkability_importance = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    user = db.relationship(
        "User", backref=db.backref("user_search_intent", uselist=False, lazy="select")
    )
