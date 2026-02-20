"""
Training data extraction for weight learning.
Extracts impressions and labels from HomeUniversal, HomeLikes, and ScoringResultsTracker.
"""

import logging
from datetime import datetime, timedelta
from typing import Any

import numpy as np

from app.models import HomeLikes, HomeUniversal, ScoringResultsTracker

logger = logging.getLogger(__name__)


class WeightTrainingDataExtractor:
    """Extracts training data for weight learning from database."""

    def __init__(self, min_impressions: int = 10, min_positive: int = 1):
        """
        Initialize extractor.

        Args:
            min_impressions: Minimum number of impressions required
            min_positive: Minimum number of positive labels required
        """
        self.min_impressions = min_impressions
        self.min_positive = min_positive

    def extract_user_training_data(
        self, user_id: str, lookback_days: int = 90
    ) -> tuple[list[dict[str, Any]], int, int]:
        """
        Extract training data for a user.

        Args:
            user_id: User ID
            lookback_days: Number of days to look back for impressions

        Returns:
            Tuple of (training_examples, num_positive, num_negative)
            training_examples: List of dicts with keys: embedding_score, llm_score, label
        """
        try:
            # Get all impressions (homes seen by user)
            cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

            impressions = HomeUniversal.query.filter(
                HomeUniversal.user_id == user_id, HomeUniversal.created_at >= cutoff_date
            ).all()

            if len(impressions) < self.min_impressions:
                logger.debug(
                    f"User {user_id} has only {len(impressions)} impressions, need {self.min_impressions}"
                )
                return [], 0, 0

            # Get positive labels (liked homes)
            liked_homes = HomeLikes.query.filter(
                HomeLikes.user_id == user_id, HomeLikes.is_liked is True
            ).all()

            liked_home_ids = {str(home.id) for home in liked_homes}
            liked_addresses = {
                self._normalize_address(home.address) for home in liked_homes if home.address
            }

            # Also check HomeUniversal for liked homes
            for imp in impressions:
                if imp.is_liked:
                    liked_home_ids.add(str(imp.id))
                    if imp.address:
                        liked_addresses.add(self._normalize_address(imp.address))

            # Build training examples
            training_examples = []
            num_positive = 0
            num_negative = 0

            for impression in impressions:
                # Determine label
                is_positive = (
                    str(impression.id) in liked_home_ids
                    or (
                        impression.address
                        and self._normalize_address(impression.address) in liked_addresses
                    )
                    or impression.is_liked
                )

                # Get subscores from ScoringResultsTracker
                # Try to find recent scoring events for this home
                score_event = (
                    ScoringResultsTracker.query.filter(
                        ScoringResultsTracker.user_id == user_id,
                        ScoringResultsTracker.home_id == str(impression.id),
                    )
                    .order_by(ScoringResultsTracker.created_at.desc())
                    .first()
                )

                # If no score event found, try to match by address or zpid
                if not score_event and impression.address:
                    # Try to find by address matching (fuzzy)
                    all_events = (
                        ScoringResultsTracker.query.filter(ScoringResultsTracker.user_id == user_id)
                        .order_by(ScoringResultsTracker.created_at.desc())
                        .limit(1000)
                        .all()
                    )

                    for event in all_events:
                        # Try to match home_id to impression
                        # This is a simplified matching - could be improved
                        if event.home_id == str(impression.id):
                            score_event = event
                            break

                # Extract subscores
                embedding_score = None
                llm_score = None

                if score_event:
                    embedding_score = score_event.embedding_score
                    llm_score = score_event.llm_score
                else:
                    # Use score from HomeUniversal if available (may need normalization)
                    if impression.score is not None:
                        # If we only have final_score, we can't extract subscores
                        # Skip this example or use imputation
                        logger.debug(f"No subscores found for impression {impression.id}, skipping")
                        continue

                # Impute missing subscores
                if embedding_score is None:
                    embedding_score = 0.5  # Default to middle value
                if llm_score is None:
                    llm_score = 0.5

                # Normalize scores to [0, 1] if needed
                # Assuming scores are already in [0, 1] or [0, 100] range
                if embedding_score > 1.0:
                    embedding_score = embedding_score / 100.0
                if llm_score > 1.0:
                    llm_score = llm_score / 100.0

                # Clamp to [0, 1]
                embedding_score = max(0.0, min(1.0, embedding_score))
                llm_score = max(0.0, min(1.0, llm_score))

                training_examples.append(
                    {
                        "embedding_score": embedding_score,
                        "llm_score": llm_score,
                        "label": 1 if is_positive else 0,
                        "home_id": str(impression.id),
                        "impression_date": impression.created_at,
                    }
                )

                if is_positive:
                    num_positive += 1
                else:
                    num_negative += 1

            # Check if we have enough positive examples
            if num_positive < self.min_positive:
                logger.debug(
                    f"User {user_id} has only {num_positive} positive examples, need {self.min_positive}"
                )
                return [], 0, 0

            logger.info(
                f"Extracted {len(training_examples)} training examples for user {user_id} "
                f"({num_positive} positive, {num_negative} negative)"
            )

            return training_examples, num_positive, num_negative

        except Exception as e:
            logger.error(f"Error extracting training data for user {user_id}: {e}", exc_info=True)
            return [], 0, 0

    def extract_cohort_training_data(
        self, cohort_id: str, user_ids: list[str], lookback_days: int = 90
    ) -> tuple[list[dict[str, Any]], int, int]:
        """
        Extract training data for a cohort (aggregate across multiple users).

        Args:
            cohort_id: Cohort ID
            user_ids: List of user IDs in the cohort
            lookback_days: Number of days to look back

        Returns:
            Tuple of (training_examples, num_positive, num_negative)
        """
        try:
            all_examples = []
            total_positive = 0
            total_negative = 0

            for user_id in user_ids:
                examples, pos, neg = self.extract_user_training_data(user_id, lookback_days)
                all_examples.extend(examples)
                total_positive += pos
                total_negative += neg

            logger.info(
                f"Extracted {len(all_examples)} training examples for cohort {cohort_id} "
                f"({total_positive} positive, {total_negative} negative)"
            )

            return all_examples, total_positive, total_negative

        except Exception as e:
            logger.error(
                f"Error extracting training data for cohort {cohort_id}: {e}", exc_info=True
            )
            return [], 0, 0

    def _normalize_address(self, address: str) -> str:
        """Normalize address for matching."""
        if not address:
            return ""
        return address.strip().lower()

    def get_training_data_summary(self, user_id: str) -> dict[str, Any]:
        """
        Get summary of available training data for a user.

        Args:
            user_id: User ID

        Returns:
            Dictionary with summary statistics
        """
        try:
            examples, num_positive, num_negative = self.extract_user_training_data(user_id)

            if not examples:
                return {
                    "has_sufficient_data": False,
                    "total_examples": 0,
                    "num_positive": 0,
                    "num_negative": 0,
                }

            # Calculate statistics
            embedding_scores = [e["embedding_score"] for e in examples]
            llm_scores = [e["llm_score"] for e in examples]

            return {
                "has_sufficient_data": len(examples) >= self.min_impressions
                and num_positive >= self.min_positive,
                "total_examples": len(examples),
                "num_positive": num_positive,
                "num_negative": num_negative,
                "embedding_score_mean": float(np.mean(embedding_scores)),
                "embedding_score_std": float(np.std(embedding_scores)),
                "llm_score_mean": float(np.mean(llm_scores)),
                "llm_score_std": float(np.std(llm_scores)),
            }

        except Exception as e:
            logger.error(f"Error getting training data summary for user {user_id}: {e}")
            return {
                "has_sufficient_data": False,
                "total_examples": 0,
                "num_positive": 0,
                "num_negative": 0,
            }


# Global instance
training_data_extractor = WeightTrainingDataExtractor()
