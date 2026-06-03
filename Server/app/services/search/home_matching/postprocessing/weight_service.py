"""
Weight retrieval and management service.
Handles getting weights for users with cohort fallback.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import db
from app.models import UserScoreWeights
from logger import log

from .cohort_assigner import cohort_assigner
from .weight_learner import weight_learner
from .weight_training_data import training_data_extractor


class WeightService:
    """Service for retrieving and managing score weights."""

    def __init__(self, min_new_impressions: int = 10):
        """
        Initialize weight service.

        Args:
            min_new_impressions: Minimum new impressions needed to trigger retraining
        """
        self.min_new_impressions = min_new_impressions

    def get_weights_for_user(
        self, user_id: str, use_cohort_fallback: bool = True
    ) -> dict[str, float] | None:
        """
        Get weights for a user, with optional cohort fallback.

        Args:
            user_id: User ID
            use_cohort_fallback: Whether to fall back to cohort weights if user weights don't exist

        Returns:
            Dictionary with 'embedding_weight' and 'llm_weight', or None if not found
        """
        try:
            # Try to get user-specific weights
            user_weights = db.session.scalar(
                select(UserScoreWeights).where(UserScoreWeights.user_id == user_id)
            )

            if user_weights:
                return {
                    "embedding_weight": user_weights.embedding_weight,
                    "llm_weight": user_weights.llm_weight,
                }

            # Fall back to cohort weights if enabled
            if use_cohort_fallback:
                cohort_id = cohort_assigner.get_user_cohort(user_id)
                cohort_weights = db.session.scalar(
                    select(UserScoreWeights).where(UserScoreWeights.cohort_id == cohort_id)
                )

                if cohort_weights:
                    log.debug(
                        "SEARCH", f"Using cohort weights for user {user_id} (cohort: {cohort_id})"
                    )
                    return {
                        "embedding_weight": cohort_weights.embedding_weight,
                        "llm_weight": cohort_weights.llm_weight,
                    }

            # No weights found
            return None

        except Exception as e:
            log.error("ERRORS", f"Error getting weights for user {user_id}: {e}")
            return None

    def should_retrain_user(self, user_id: str) -> bool:
        """
        Check if a user should be retrained (has enough new data).

        Args:
            user_id: User ID

        Returns:
            True if user should be retrained
        """
        try:
            # Get last training time
            user_weights = db.session.scalar(
                select(UserScoreWeights).where(UserScoreWeights.user_id == user_id)
            )

            if not user_weights:
                # No weights exist, check if we have enough data to train
                summary = training_data_extractor.get_training_data_summary(user_id)
                return summary.get("has_sufficient_data", False)

            # Check if enough time has passed or enough new impressions
            last_trained = user_weights.last_trained_at
            if not last_trained:
                return True

            # Check for new impressions since last training
            # This is a simplified check - could be improved
            summary = training_data_extractor.get_training_data_summary(user_id)
            total_examples = summary.get("total_examples", 0)
            previous_count = user_weights.training_samples_count

            if total_examples >= previous_count + self.min_new_impressions:
                return True

            # Also retrain if it's been more than 30 days
            days_since_training = (datetime.now(timezone.utc) - last_trained).days
            if days_since_training >= 30:
                return True

            return False

        except Exception as e:
            log.error("ERRORS", f"Error checking if user {user_id} should retrain: {e}")
            return False

    def get_or_compute_weights(
        self, user_id: str, force_retrain: bool = False
    ) -> dict[str, float] | None:
        """
        Get existing weights or compute new ones if needed.

        Args:
            user_id: User ID
            force_retrain: Force retraining even if not needed

        Returns:
            Dictionary with weights or None
        """
        try:
            # Check if we should retrain
            if force_retrain or self.should_retrain_user(user_id):
                # Extract training data
                (
                    training_examples,
                    num_positive,
                    num_negative,
                ) = training_data_extractor.extract_user_training_data(user_id)

                if not training_examples:
                    # No data, try cohort fallback
                    log.debug(
                        "SEARCH", f"No training data for user {user_id}, using cohort fallback"
                    )
                    return self.get_weights_for_user(user_id, use_cohort_fallback=True)

                # Train and update weights
                weights = weight_learner.update_user_weights(user_id, training_examples)

                if weights:
                    return {
                        "embedding_weight": weights.embedding_weight,
                        "llm_weight": weights.llm_weight,
                    }
                else:
                    # Training failed, use cohort fallback
                    return self.get_weights_for_user(user_id, use_cohort_fallback=True)
            else:
                # Use existing weights
                return self.get_weights_for_user(user_id, use_cohort_fallback=True)

        except Exception as e:
            log.error("ERRORS", f"Error getting/computing weights for user {user_id}: {e}")
            return None

    def initialize_cohort_weights(
        self, cohort_id: str, user_ids: list[str]
    ) -> dict[str, float] | None:
        """
        Initialize or update cohort weights from user data.

        Args:
            cohort_id: Cohort ID
            user_ids: List of user IDs in the cohort

        Returns:
            Dictionary with weights or None
        """
        try:
            # Extract training data for cohort
            (
                training_examples,
                num_positive,
                num_negative,
            ) = training_data_extractor.extract_cohort_training_data(cohort_id, user_ids)

            if not training_examples:
                log.warn("SEARCH", f"No training data for cohort {cohort_id}")
                return None

            # Train and update weights
            weights = weight_learner.update_cohort_weights(cohort_id, training_examples)

            if weights:
                return {
                    "embedding_weight": weights.embedding_weight,
                    "llm_weight": weights.llm_weight,
                }

            return None

        except Exception as e:
            log.error("ERRORS", f"Error initializing cohort weights for {cohort_id}: {e}")
            return None

    def get_default_weights(self) -> dict[str, float]:
        """
        Get default weights (equal weighting).

        Returns:
            Dictionary with default weights
        """
        return {"embedding_weight": 0.5, "llm_weight": 0.5}


# Global instance
weight_service = WeightService()
