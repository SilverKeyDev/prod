"""Demographics (rarely changes). Name stays on users; do not duplicate."""

from datetime import datetime

from app import db


class UserDemographics(db.Model):
    __tablename__ = "user_demographics"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    age = db.Column(db.Integer, nullable=True)
    pets = db.Column(db.String(100), nullable=True)
    occupation = db.Column(db.String(100), nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    why_joining_silverkey = db.Column(db.Text, nullable=True)  # JSON array of strings
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    user = db.relationship(
        "User", backref=db.backref("user_demographics", uselist=False, lazy="select")
    )
