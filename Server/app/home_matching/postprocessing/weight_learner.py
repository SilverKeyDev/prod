"""
Logistic regression-based weight learner for subscore blending.
"""

import logging
from typing import Any

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score

from app import db
from app.models import UserScoreWeights

logger = logging.getLogger(__name__)


class WeightLearner:
    """Learns optimal weights for subscore blending using logistic regression."""

    def __init__(self, C: float = 1.0, random_state: int = 42):
        """
        Initialize weight learner.

        Args:
            C: Inverse regularization strength (smaller = stronger regularization)
            random_state: Random seed for reproducibility
        """
        self.C = C
        self.random_state = random_state
        self.model = LogisticRegression(
            penalty="l2", C=C, random_state=random_state, max_iter=1000, solver="lbfgs"
        )

    def fit(self, training_examples: list[dict[str, Any]]) -> tuple[float, float, float, float]:
        """
        Train logistic regression model on training examples.

        Args:
            training_examples: List of dicts with keys: embedding_score, llm_score, label

        Returns:
            Tuple of (embedding_weight, llm_weight, accuracy, auc)
        """
        try:
            if not training_examples:
                raise ValueError("No training examples provided")

            # Extract features and labels
            X = np.array([[ex["embedding_score"], ex["llm_score"]] for ex in training_examples])
            y = np.array([ex["label"] for ex in training_examples])

            if len(np.unique(y)) < 2:
                raise ValueError("Need both positive and negative examples")

            # Train model
            self.model.fit(X, y)

            # Get learned coefficients
            # Logistic regression: P(y=1) = sigmoid(w0 + w1*embedding + w2*llm)
            # Weights are the coefficients (w1, w2)
            coefficients = self.model.coef_[0]
            embedding_coef = coefficients[0]
            llm_coef = coefficients[1]
            # Convert to blend weights: coefficients can be negative; use absolute values
            # and normalize so weights sum to 1.
            total_abs = abs(embedding_coef) + abs(llm_coef)
            if total_abs > 0:
                embedding_weight = abs(embedding_coef) / total_abs
                llm_weight = abs(llm_coef) / total_abs
            else:
                # Fallback to equal weights
                embedding_weight = 0.5
                llm_weight = 0.5

            # Calculate metrics
            y_pred = self.model.predict(X)
            y_pred_proba = self.model.predict_proba(X)[:, 1]

            accuracy = accuracy_score(y, y_pred)
            try:
                auc = roc_auc_score(y, y_pred_proba)
            except ValueError:
                # If only one class in y, AUC is undefined
                auc = 0.5

            logger.info(
                f"Trained model: embedding_weight={embedding_weight:.3f}, "
                f"llm_weight={llm_weight:.3f}, accuracy={accuracy:.3f}, auc={auc:.3f}"
            )

            return (
                float(embedding_weight),
                float(llm_weight),
                float(accuracy),
                float(auc),
            )

        except Exception as e:
            logger.error(f"Error training weight learner: {e}", exc_info=True)
            # Return default weights on error
            return (0.5, 0.5, 0.0, 0.5)

    def predict_weights(self, training_examples: list[dict[str, Any]]) -> tuple[float, float]:
        """
        Predict weights from training examples (train and return weights).

        Args:
            training_examples: List of dicts with keys: embedding_score, llm_score, label

        Returns:
            Tuple of (embedding_weight, llm_weight)
        """
        embedding_weight, llm_weight, _, _ = self.fit(training_examples)
        return embedding_weight, llm_weight

    def update_user_weights(
        self, user_id: str, training_examples: list[dict[str, Any]], model_version: str = "1.0"
    ) -> UserScoreWeights | None:
        """
        Train model and update weights in database for a user.

        Args:
            user_id: User ID
            training_examples: Training data
            model_version: Model version string

        Returns:
            UserScoreWeights instance or None on error
        """
        try:
            if not training_examples:
                logger.warning(f"No training examples for user {user_id}")
                return None

            # Train model
            embedding_weight, llm_weight, accuracy, auc = self.fit(training_examples)

            # Update database
            weights = UserScoreWeights.create_or_update(
                user_id=user_id,
                embedding_weight=embedding_weight,
                llm_weight=llm_weight,
                training_samples_count=len(training_examples),
                model_version=model_version,
                training_accuracy=accuracy,
                training_auc=auc,
            )

            db.session.add(weights)
            db.session.commit()

            logger.info(
                f"Updated weights for user {user_id}: "
                f"embedding={embedding_weight:.3f}, llm={llm_weight:.3f}"
            )

            return weights

        except Exception as e:
            logger.error(f"Error updating weights for user {user_id}: {e}", exc_info=True)
            db.session.rollback()
            return None

    def update_cohort_weights(
        self, cohort_id: str, training_examples: list[dict[str, Any]], model_version: str = "1.0"
    ) -> UserScoreWeights | None:
        """
        Train model and update weights in database for a cohort.

        Args:
            cohort_id: Cohort ID
            training_examples: Training data
            model_version: Model version string

        Returns:
            UserScoreWeights instance or None on error
        """
        try:
            if not training_examples:
                logger.warning(f"No training examples for cohort {cohort_id}")
                return None

            # Train model
            embedding_weight, llm_weight, accuracy, auc = self.fit(training_examples)

            # Update database
            weights = UserScoreWeights.create_or_update(
                cohort_id=cohort_id,
                embedding_weight=embedding_weight,
                llm_weight=llm_weight,
                training_samples_count=len(training_examples),
                model_version=model_version,
                training_accuracy=accuracy,
                training_auc=auc,
            )

            db.session.add(weights)
            db.session.commit()

            logger.info(
                f"Updated weights for cohort {cohort_id}: "
                f"embedding={embedding_weight:.3f}, llm={llm_weight:.3f}"
            )

            return weights

        except Exception as e:
            logger.error(f"Error updating weights for cohort {cohort_id}: {e}", exc_info=True)
            db.session.rollback()
            return None


# Global instance
weight_learner = WeightLearner()
