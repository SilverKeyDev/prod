"""Transaction model - represents a real estate transaction (e.g. SkySlope file)."""

from app import db


class Transaction(db.Model):
    """Transaction - links to SkySlope file and tracks buyer/agent."""

    __tablename__ = "transactions"

    id = db.Column(db.String(36), primary_key=True)
    primary_agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    buyer_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    skyslope_file_id = db.Column(db.String(100), nullable=True)
