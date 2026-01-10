from datetime import datetime
import uuid
from app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB, DOUBLE_PRECISION
from sqlalchemy import BigInteger, String, Integer, DateTime, Text, Index

class ScoringResultsTracker(db.Model):
    """Tracks event-level scoring results for home matching."""
    
    __tablename__ = "home_score_event"
    
    __table_args__ = (
        Index('idx_hse_user_time', 'user_id', 'created_at'),
        Index('idx_hse_home_time', 'home_id', 'created_at'),
        Index('idx_hse_request', 'request_id'),
        Index('idx_hse_experiment_time', 'experiment_key', 'experiment_variant', 'created_at'),
    )
    
    id = db.Column(BigInteger().with_variant(db.Integer, 'sqlite'), primary_key=True, autoincrement=True)
    created_at = db.Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default=db.func.now())
    
    request_id = db.Column(String(36), nullable=False)
    user_id = db.Column(String(36), nullable=False)
    home_id = db.Column(String(36), nullable=False)
    
    embedding_score = db.Column(DOUBLE_PRECISION().with_variant(db.Float, 'sqlite'), nullable=True)
    llm_score = db.Column(DOUBLE_PRECISION().with_variant(db.Float, 'sqlite'), nullable=True)
    final_score = db.Column(DOUBLE_PRECISION().with_variant(db.Float, 'sqlite'), nullable=False)
    
    embedding_model = db.Column(Text, nullable=True)
    embedding_provider = db.Column(Text, nullable=True)
    llm_model = db.Column(Text, nullable=True)
    llm_provider = db.Column(Text, nullable=True)
    prompt_version = db.Column(Text, nullable=True)
    
    weights = db.Column(JSONB().with_variant(db.JSON, 'sqlite'), nullable=True)  # {"embedding":0.6,"llm":0.4}
    rank_position = db.Column(Integer, nullable=True)
    candidate_set_size = db.Column(Integer, nullable=True)
    latency_ms = db.Column(Integer, nullable=True)
    
    # Optional but very useful for later evaluation
    experiment_key = db.Column(Text, nullable=True)
    experiment_variant = db.Column(Text, nullable=True)
    session_id = db.Column(Text, nullable=True)
    
    def __init__(self, **kwargs):
        super(ScoringResultsTracker, self).__init__(**kwargs)
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "home_id": self.home_id,
            "embedding_score": self.embedding_score,
            "llm_score": self.llm_score,
            "final_score": self.final_score,
            "embedding_model": self.embedding_model,
            "embedding_provider": self.embedding_provider,
            "llm_model": self.llm_model,
            "llm_provider": self.llm_provider,
            "prompt_version": self.prompt_version,
            "weights": self.weights,
            "rank_position": self.rank_position,
            "candidate_set_size": self.candidate_set_size,
            "latency_ms": self.latency_ms,
            "experiment_key": self.experiment_key,
            "experiment_variant": self.experiment_variant,
            "session_id": self.session_id,
        }
    
    @classmethod
    def create_from_scoring_result(
        cls,
        request_id: str,
        user_id: str,
        home_id: str,
        embedding_score: float = None,
        llm_score: float = None,
        final_score: float = 0.0,
        embedding_model: str = None,
        embedding_provider: str = None,
        llm_model: str = None,
        llm_provider: str = None,
        prompt_version: str = None,
        weights: dict = None,
        rank_position: int = None,
        candidate_set_size: int = None,
        latency_ms: int = None,
        experiment_key: str = None,
        experiment_variant: str = None,
        session_id: str = None
    ) -> 'ScoringResultsTracker':
        """Create a new scoring event record from scoring result data."""
        return cls(
            request_id=request_id,
            user_id=user_id,
            home_id=home_id,
            embedding_score=embedding_score,
            llm_score=llm_score,
            final_score=final_score,
            embedding_model=embedding_model,
            embedding_provider=embedding_provider,
            llm_model=llm_model,
            llm_provider=llm_provider,
            prompt_version=prompt_version,
            weights=weights,
            rank_position=rank_position,
            candidate_set_size=candidate_set_size,
            latency_ms=latency_ms,
            experiment_key=experiment_key,
            experiment_variant=experiment_variant,
            session_id=session_id
        )
