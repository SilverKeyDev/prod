# pyright: reportUndefinedVariable=false
import uuid
from datetime import datetime, timezone

from sqlalchemy import Index, select
from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserScoreWeights(db.Model):
    """Stores learned weights for subscore blending per user or per cohort."""

    __tablename__ = "user_score_weights"

    __table_args__ = (
        Index("idx_usw_user", "user_id"),
        Index("idx_usw_cohort", "cohort_id"),
        Index("idx_usw_user_updated", "user_id", "last_trained_at"),
    )

    id: Mapped[str] = mapped_column(
        db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Either user_id OR cohort_id should be set, not both
    user_id: Mapped[str | None] = mapped_column(db.String(36))  # Nullable for cohort weights
    cohort_id: Mapped[str | None] = mapped_column(
        db.String(64)
    )  # Nullable for user-specific weights

    # Learned weights (normalized to sum to 1.0)
    embedding_weight: Mapped[float] = mapped_column(db.Float)
    llm_weight: Mapped[float] = mapped_column(db.Float)

    # Training metadata
    training_samples_count: Mapped[int] = mapped_column(db.Integer, default=0)
    last_trained_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    model_version: Mapped[str] = mapped_column(db.String(20), default="1.0")

    # Performance metrics (optional, for monitoring)
    training_accuracy: Mapped[float | None] = mapped_column(db.Float)
    training_auc: Mapped[float | None] = mapped_column(db.Float)

    created_at: Mapped[datetime | None] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    @classmethod
    def create_or_update(
        cls,
        user_id: str | None = None,
        cohort_id: str | None = None,
        embedding_weight: float | None = None,
        llm_weight: float | None = None,
        training_samples_count: int = 0,
        model_version: str = "1.0",
        training_accuracy: float | None = None,
        training_auc: float | None = None,
    ) -> "UserScoreWeights":
        """Create or update weights for a user or cohort."""
        if user_id and cohort_id:
            raise ValueError("Cannot set both user_id and cohort_id")
        if not user_id and not cohort_id:
            raise ValueError("Must set either user_id or cohort_id")

        # Normalize weights to sum to 1.0
        if embedding_weight is not None and llm_weight is not None:
            total = embedding_weight + llm_weight
            if total > 0:
                embedding_weight = embedding_weight / total
                llm_weight = llm_weight / total
            else:
                # Default to equal weights if both are 0
                embedding_weight = 0.5
                llm_weight = 0.5

        # Find existing record
        if user_id:
            existing = db.session.scalar(select(cls).where(cls.user_id == user_id))
        else:
            assert cohort_id is not None  # guaranteed by validation above
            existing = db.session.scalar(select(cls).where(cls.cohort_id == cohort_id))

        if existing:
            # Update existing
            if embedding_weight is not None:
                existing.embedding_weight = embedding_weight
            if llm_weight is not None:
                existing.llm_weight = llm_weight
            if training_samples_count is not None:
                existing.training_samples_count = training_samples_count
            existing.last_trained_at = datetime.now(timezone.utc)
            existing.model_version = model_version
            if training_accuracy is not None:
                existing.training_accuracy = training_accuracy
            if training_auc is not None:
                existing.training_auc = training_auc
            return existing
        else:
            # Create new
            return cls(
                user_id=user_id,
                cohort_id=cohort_id,
                embedding_weight=embedding_weight or 0.5,
                llm_weight=llm_weight or 0.5,
                training_samples_count=training_samples_count,
                model_version=model_version,
                training_accuracy=training_accuracy,
                training_auc=training_auc,
            )

    def __repr__(self):
        return f"<UserScoreWeights(user_id={self.user_id}, cohort_id={self.cohort_id}, embedding={self.embedding_weight:.3f}, llm={self.llm_weight:.3f})>"
