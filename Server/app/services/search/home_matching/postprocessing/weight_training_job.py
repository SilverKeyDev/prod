"""
Background job for periodic weight retraining.
Can be run via Celery or as a scheduled task.
"""

import logging
from typing import Any

from app.models import User

from .cohort_assigner import cohort_assigner
from .weight_learner import weight_learner
from .weight_service import weight_service
from .weight_training_data import training_data_extractor

logger = logging.getLogger(__name__)


class WeightTrainingJob:
    """Job for training and updating user and cohort weights."""

    def __init__(self):
        pass

    def train_user_weights(self, user_id: str, force: bool = False) -> dict[str, Any]:
        """
        Train weights for a specific user.

        Args:
            user_id: User ID
            force: Force retraining even if not needed

        Returns:
            Dictionary with training results
        """
        try:
            # Check if retraining is needed
            if not force and not weight_service.should_retrain_user(user_id):
                return {"success": False, "message": "Retraining not needed", "user_id": user_id}

            # Extract training data
            (
                training_examples,
                num_positive,
                num_negative,
            ) = training_data_extractor.extract_user_training_data(user_id)

            if not training_examples:
                return {
                    "success": False,
                    "message": "Insufficient training data",
                    "user_id": user_id,
                    "num_examples": 0,
                }

            # Train model
            weights = weight_learner.update_user_weights(user_id, training_examples)

            if weights:
                return {
                    "success": True,
                    "user_id": user_id,
                    "embedding_weight": weights.embedding_weight,
                    "llm_weight": weights.llm_weight,
                    "training_samples": len(training_examples),
                    "num_positive": num_positive,
                    "num_negative": num_negative,
                    "accuracy": weights.training_accuracy,
                    "auc": weights.training_auc,
                }
            else:
                return {"success": False, "message": "Training failed", "user_id": user_id}

        except Exception as e:
            logger.error(f"Error training weights for user {user_id}: {e}", exc_info=True)
            return {"success": False, "message": str(e), "user_id": user_id}

    def train_cohort_weights(self, cohort_id: str, user_ids: list[str]) -> dict[str, Any]:
        """
        Train weights for a cohort.

        Args:
            cohort_id: Cohort ID
            user_ids: List of user IDs in the cohort

        Returns:
            Dictionary with training results
        """
        try:
            # Extract training data for cohort
            (
                training_examples,
                num_positive,
                num_negative,
            ) = training_data_extractor.extract_cohort_training_data(cohort_id, user_ids)

            if not training_examples:
                return {
                    "success": False,
                    "message": "Insufficient training data",
                    "cohort_id": cohort_id,
                    "num_examples": 0,
                }

            # Train model
            weights = weight_learner.update_cohort_weights(cohort_id, training_examples)

            if weights:
                return {
                    "success": True,
                    "cohort_id": cohort_id,
                    "embedding_weight": weights.embedding_weight,
                    "llm_weight": weights.llm_weight,
                    "training_samples": len(training_examples),
                    "num_positive": num_positive,
                    "num_negative": num_negative,
                    "accuracy": weights.training_accuracy,
                    "auc": weights.training_auc,
                }
            else:
                return {"success": False, "message": "Training failed", "cohort_id": cohort_id}

        except Exception as e:
            logger.error(f"Error training weights for cohort {cohort_id}: {e}", exc_info=True)
            return {"success": False, "message": str(e), "cohort_id": cohort_id}

    def train_all_eligible_users(self, limit: int = 100) -> dict[str, Any]:
        """
        Train weights for all users who need retraining.

        Args:
            limit: Maximum number of users to process

        Returns:
            Dictionary with summary statistics
        """
        try:
            # Get all users
            users = User.query.filter(User.has_preferences.is_(True)).limit(limit).all()

            results = {
                "total_users": len(users),
                "trained": 0,
                "skipped": 0,
                "failed": 0,
                "details": [],
            }

            for user in users:
                user_id = str(user.id)

                if weight_service.should_retrain_user(user_id):
                    result = self.train_user_weights(user_id, force=False)
                    results["details"].append(result)

                    if result.get("success"):
                        results["trained"] += 1
                    else:
                        results["failed"] += 1
                else:
                    results["skipped"] += 1

            logger.info(
                f"Trained weights for {results['trained']} users, "
                f"skipped {results['skipped']}, failed {results['failed']}"
            )

            return results

        except Exception as e:
            logger.error(f"Error in train_all_eligible_users: {e}", exc_info=True)
            return {"total_users": 0, "trained": 0, "skipped": 0, "failed": 0, "error": str(e)}

    def initialize_cohort_weights(self, cohort_id: str | None = None) -> dict[str, Any]:
        """
        Initialize or update weights for a cohort (or all cohorts).

        Args:
            cohort_id: Specific cohort ID, or None for all cohorts

        Returns:
            Dictionary with results
        """
        try:
            # For now, we'll initialize default cohort
            # In a full implementation, we'd iterate over all cohorts
            if cohort_id is None:
                cohort_id = cohort_assigner.DEFAULT_COHORT

            # Get users in cohort (simplified - would need better cohort querying)
            # For default cohort, get users without preferences
            if cohort_id == cohort_assigner.DEFAULT_COHORT:
                users = User.query.filter(User.has_preferences.is_(False)).all()
            else:
                # For other cohorts, we'd need to query based on cohort characteristics
                # This is a placeholder
                users = []

            user_ids = [str(u.id) for u in users]

            if not user_ids:
                return {
                    "success": False,
                    "message": f"No users found for cohort {cohort_id}",
                    "cohort_id": cohort_id,
                }

            result = self.train_cohort_weights(cohort_id, user_ids)
            return result

        except Exception as e:
            logger.error(f"Error initializing cohort weights: {e}", exc_info=True)
            return {"success": False, "message": str(e), "cohort_id": cohort_id}


# Global instance
weight_training_job = WeightTrainingJob()


# Celery task wrapper (if using Celery)
def train_user_weights_task(user_id: str, force: bool = False):
    """
    Celery task wrapper for training user weights.

    Usage:
        from app.services.search.home_matching.postprocessing.weight_training_job import train_user_weights_task
        train_user_weights_task.delay(user_id, force=False)
    """
    return weight_training_job.train_user_weights(user_id, force)


def train_all_eligible_users_task(limit: int = 100):
    """
    Celery task wrapper for training all eligible users.

    Usage:
        from app.services.search.home_matching.postprocessing.weight_training_job import train_all_eligible_users_task
        train_all_eligible_users_task.delay(limit=100)
    """
    return weight_training_job.train_all_eligible_users(limit)
