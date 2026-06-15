"""
Training data extraction for weight learning.
Extracts impressions and labels from UserPropertyLink and ScoringResultsTracker.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import numpy as np
from sqlalchemy import select

from app import db
from app.models import ScoringResultsTracker, UserPropertyLink
from logger import log


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
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=lookback_days)

            impressions = db.session.scalars(
                select(UserPropertyLink).where(
                    UserPropertyLink.user_id == user_id,
                    UserPropertyLink.created_at >= cutoff_date,
                )
            ).all()

            if len(impressions) < self.min_impressions:
                log.debug(
                    "SEARCH",
                    "User %s has only %d impressions, need %d",
                    {
                        "arg0": str(user_id),
                        "arg1": str(len(impressions)),
                        "arg2": str(self.min_impressions),
                    },
                )
                return [], 0, 0

            liked_home_ids = {str(imp.property_id) for imp in impressions if imp.is_liked}

            training_examples = []
            num_positive = 0
            num_negative = 0

            for impression in impressions:
                is_positive = str(impression.property_id) in liked_home_ids or impression.is_liked

                score_event = db.session.scalar(
                    select(ScoringResultsTracker)
                    .where(
                        ScoringResultsTracker.user_id == user_id,
                        ScoringResultsTracker.home_id == str(impression.property_id),
                    )
                    .order_by(ScoringResultsTracker.created_at.desc())
                )

                embedding_score = None
                llm_score = None

                if score_event:
                    embedding_score = score_event.embedding_score
                    llm_score = score_event.llm_score
                else:
                    if impression.score is not None:
                        log.debug(
                            "SEARCH", "No subscores found for link %s, skipping", impression.id
                        )
                        continue

                if embedding_score is None:
                    embedding_score = 0.5
                if llm_score is None:
                    llm_score = 0.5

                if embedding_score > 1.0:
                    embedding_score = embedding_score / 100.0
                if llm_score > 1.0:
                    llm_score = llm_score / 100.0

                embedding_score = max(0.0, min(1.0, embedding_score))
                llm_score = max(0.0, min(1.0, llm_score))

                training_examples.append(
                    {
                        "embedding_score": embedding_score,
                        "llm_score": llm_score,
                        "label": 1 if is_positive else 0,
                        "home_id": str(impression.property_id),
                        "impression_date": impression.created_at,
                    }
                )

                if is_positive:
                    num_positive += 1
                else:
                    num_negative += 1

            # Check if we have enough positive examples
            if num_positive < self.min_positive:
                log.debug(
                    "SEARCH",
                    f"User {user_id} has only {num_positive} positive examples, need {self.min_positive}",
                )
                return [], 0, 0

            log.info(
                "SEARCH",
                f"Extracted {len(training_examples)} training examples for user {user_id} "
                f"({num_positive} positive, {num_negative} negative)",
            )

            return training_examples, num_positive, num_negative

        except Exception as e:
            log.error("ERRORS", f"Error extracting training data for user {user_id}: {e}")
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

            log.info(
                "SEARCH",
                f"Extracted {len(all_examples)} training examples for cohort {cohort_id} "
                f"({total_positive} positive, {total_negative} negative)",
            )

            return all_examples, total_positive, total_negative

        except Exception as e:
            log.error("ERRORS", f"Error extracting training data for cohort {cohort_id}: {e}")
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
            log.error("ERRORS", f"Error getting training data summary for user {user_id}: {e}")
            return {
                "has_sufficient_data": False,
                "total_examples": 0,
                "num_positive": 0,
                "num_negative": 0,
            }


# Global instance
training_data_extractor = WeightTrainingDataExtractor()
