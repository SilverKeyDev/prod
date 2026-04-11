from datetime import datetime, timezone
from typing import Any

from sqlalchemy import BigInteger, DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app import db


class ScoringResultsTracker(db.Model):
    """Tracks event-level scoring results for home matching."""

    __tablename__ = "home_score_event"

    __table_args__ = (
        Index("idx_hse_user_time", "user_id", "created_at"),
        Index("idx_hse_home_time", "home_id", "created_at"),
        Index("idx_hse_request", "request_id"),
        Index("idx_hse_experiment_time", "experiment_key", "experiment_variant", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=db.func.now(),
    )

    request_id: Mapped[str] = mapped_column(String(36))
    user_id: Mapped[str] = mapped_column(String(36))
    home_id: Mapped[str] = mapped_column(String(36))

    embedding_score: Mapped[float | None] = mapped_column(
        DOUBLE_PRECISION().with_variant(db.Float, "sqlite")
    )
    llm_score: Mapped[float | None] = mapped_column(
        DOUBLE_PRECISION().with_variant(db.Float, "sqlite")
    )
    final_score: Mapped[float] = mapped_column(DOUBLE_PRECISION().with_variant(db.Float, "sqlite"))

    embedding_model: Mapped[str | None] = mapped_column(Text)
    embedding_provider: Mapped[str | None] = mapped_column(Text)
    llm_model: Mapped[str | None] = mapped_column(Text)
    llm_provider: Mapped[str | None] = mapped_column(Text)
    prompt_version: Mapped[str | None] = mapped_column(Text)

    weights: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB().with_variant(db.JSON, "sqlite")
    )  # {"embedding":0.6,"llm":0.4}
    rank_position: Mapped[int | None] = mapped_column(Integer)
    candidate_set_size: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)

    # Optional but very useful for later evaluation
    experiment_key: Mapped[str | None] = mapped_column(Text)
    experiment_variant: Mapped[str | None] = mapped_column(Text)
    session_id: Mapped[str | None] = mapped_column(Text)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

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
        embedding_score: float | None = None,
        llm_score: float | None = None,
        final_score: float = 0.0,
        embedding_model: str | None = None,
        embedding_provider: str | None = None,
        llm_model: str | None = None,
        llm_provider: str | None = None,
        prompt_version: str | None = None,
        weights: dict[str, Any] | None = None,
        rank_position: int | None = None,
        candidate_set_size: int | None = None,
        latency_ms: int | None = None,
        experiment_key: str | None = None,
        experiment_variant: str | None = None,
        session_id: str | None = None,
    ) -> "ScoringResultsTracker":
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
            session_id=session_id,
        )
