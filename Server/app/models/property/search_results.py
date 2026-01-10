from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import JSONB
from app import db

# -------------------------
# Users already defined by you
# -------------------------
# class User(db.Model): ...

# =========================
# Search session: one row per search run
# =========================
class Search(db.Model):
    __tablename__ = 'search_session'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    query_params = db.Column(JSONB, nullable=False)
    mls_home_id = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    user = db.relationship('User', backref=db.backref('search_sessions', lazy='dynamic'))

    def __init__(self, **kwargs):
        super(Search, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'query_params': self.query_params,
            'mls_home_id': self.mls_home_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
