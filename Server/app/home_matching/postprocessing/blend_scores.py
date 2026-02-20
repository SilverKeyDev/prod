"""
Ensemble scoring logic using embedding-based methods.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from ..config.settings import DEFAULT_TOP_K
from ..embeddings.scorer import EmbeddingScorer
from .batch_scoring import score_home_batch
from .comparison import compare_scoring_methods
from .stats import get_ensemble_stats

logger = logging.getLogger(__name__)


class EnsembleScorer:
    """
    Scoring system using embedding-based methods.

    Args:
        embedding_provider: Provider for embedding model (default: "sentence_transformer")
        embedding_model: Specific embedding model name (optional)
        user_id: User ID for tracking (optional)

    Example:
        >>> ensemble = EnsembleScorer(user_id="user_123")
        >>> result = ensemble.score_user_home_pair(user_data, home_data)
        >>> print(result['final_score'])
    """

    def __init__(
        self,
        embedding_provider: str = "sentence_transformer",
        embedding_model: str | None = None,
        user_id: str | None = None,
    ):
        self.user_id = user_id

        # Initialize scorer
        self.embedding_scorer = EmbeddingScorer(embedding_provider, embedding_model)

        # Store provider/model info for tracking
        self.embedding_provider = embedding_provider
        self.embedding_model = embedding_model

        # Performance tracking
        self.score_history = []

    def blend_scores(self, embedding_score: float) -> float:
        """Scale embedding score to 0-100 scale. Input is clamped to [0, 1] if outside."""
        try:
            # Ensure score is in [0, 1] range
            embedding_score = max(0.0, min(1.0, embedding_score))

            # Scale to 0-100 and round to exactly one decimal place
            scaled_score = embedding_score * 100.0
            rounded_score = round(scaled_score, 1)

            return float(rounded_score)

        except Exception as e:
            logger.error(f"Error scaling score: {e}")
            return 0.0

    def score_user_home_pair(
        self,
        user_data: dict[str, Any],
        home_data: dict[str, Any],
        include_explanations: bool = False,
        request_id: str | None = None,
        rank_position: int | None = None,
        candidate_set_size: int | None = None,
        experiment_key: str | None = None,
        experiment_variant: str | None = None,
        session_id: str | None = None,
        track_to_db: bool = True,
    ) -> dict[str, Any]:
        """Score a single user-home pair using embedding methods."""
        start_time = time.time()
        try:
            result = {
                "user_id": user_data.get("user_id", "unknown"),
                "home_id": home_data.get("home_id", "unknown"),
                "scores": {},
                "final_score": 0.0,
            }

            # Get embedding score
            try:
                embedding_score = self.embedding_scorer.get_user_home_similarity(
                    user_data, home_data
                )
                result["scores"]["embedding"] = embedding_score
            except Exception as e:
                logger.error(f"Embedding scoring failed: {e}")
                result["scores"]["embedding"] = 0.0
                result["errors"] = result.get("errors", {})
                result["errors"]["embedding"] = str(e)

            # Scale score to 0-100
            final_score = self.blend_scores(result["scores"]["embedding"])
            result["final_score"] = final_score

            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)

            # Track to database if requested
            if track_to_db and request_id:
                try:
                    self._track_scoring_event(
                        request_id=request_id,
                        user_id=result["user_id"],
                        home_id=result["home_id"],
                        embedding_score=result["scores"].get("embedding"),
                        final_score=final_score,
                        rank_position=rank_position,
                        candidate_set_size=candidate_set_size,
                        latency_ms=latency_ms,
                        experiment_key=experiment_key,
                        experiment_variant=experiment_variant,
                        session_id=session_id,
                    )
                except Exception as e:
                    logger.warning(f"Failed to track scoring event to DB: {e}")

            # Track performance
            self.score_history.append(
                {"embedding": result["scores"]["embedding"], "final": final_score}
            )

            return result

        except Exception as e:
            logger.error(f"Error scoring user-home pair: {e}")
            return {
                "user_id": user_data.get("user_id", "unknown"),
                "home_id": home_data.get("home_id", "unknown"),
                "final_score": 0.0,
                "error": str(e),
            }

    def rank_homes_for_user(
        self,
        user_data: dict[str, Any],
        homes_data: list[dict[str, Any]],
        top_k: int | None = None,
        include_explanations: bool = False,
        request_id: str | None = None,
        experiment_key: str | None = None,
        experiment_variant: str | None = None,
        session_id: str | None = None,
        track_to_db: bool = True,
    ) -> list[dict[str, Any]]:
        """Rank multiple homes for a user using concurrent ensemble scoring."""
        try:
            top_k = top_k or DEFAULT_TOP_K

            if not homes_data:
                return []

            # Divide homes into batches of 3 for concurrent processing
            batch_size = 3
            home_batches = []
            for i in range(0, len(homes_data), batch_size):
                batch = homes_data[i : i + batch_size]
                home_batches.append((i, batch))  # Store original indices for proper ordering

            # Score all batches concurrently (typed so __setitem__ accepts dict)
            scored_homes: list[dict[str, Any] | None] = [None] * len(homes_data)

            # Use ThreadPoolExecutor for concurrent batch processing
            max_workers = min(len(home_batches), 10)  # Limit concurrent threads
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all batch scoring tasks
                future_to_batch = {
                    executor.submit(
                        score_home_batch,
                        user_data,
                        batch_start_idx,
                        batch_homes,
                        self.embedding_scorer,
                        self.blend_scores,
                        include_explanations,
                        request_id=request_id,
                        embedding_provider=self.embedding_provider,
                        embedding_model=self.embedding_model,
                        candidate_set_size=len(homes_data),
                        experiment_key=experiment_key,
                        experiment_variant=experiment_variant,
                        session_id=session_id,
                        track_to_db=track_to_db,
                    ): (batch_start_idx, batch_homes)
                    for batch_start_idx, batch_homes in home_batches
                }

                # Collect results as they complete
                completed_batches = 0
                for future in as_completed(future_to_batch):
                    batch_start_idx, batch_homes = future_to_batch[future]
                    try:
                        batch_results = future.result()
                        # Place results in correct positions
                        for i, result in enumerate(batch_results):
                            scored_homes[batch_start_idx + i] = result

                        completed_batches += 1

                    except Exception as e:
                        logger.error(
                            f"❌ Error processing batch starting at index {batch_start_idx}: {e}"
                        )
                        # Fill with error results
                        for i, home_data in enumerate(batch_homes):
                            scored_homes[batch_start_idx + i] = {
                                "home_data": home_data,
                                "home_id": home_data.get("home_id", f"home_{batch_start_idx + i}"),
                                "final_score": 0.0,
                                "error": str(e),
                            }

            # Filter out any None results (shouldn't happen, but safety check)
            filtered_homes: list[dict[str, Any]] = [
                home for home in scored_homes if home is not None
            ]

            # Sort by final score (highest first)
            filtered_homes.sort(key=lambda x: x.get("final_score", 0.0), reverse=True)

            # Add ranks and track to DB if requested
            for i, home in enumerate(filtered_homes):
                home["rank"] = i + 1

                # Track to database if requested (update rank_position)
                # Only update if home_id exists and is not None
                home_id = home.get("home_id")
                if track_to_db and request_id and home_id:
                    try:
                        self._update_rank_position(
                            request_id=request_id, home_id=home_id, rank_position=i + 1
                        )
                    except Exception as e:
                        logger.warning(f"Failed to update rank position in DB: {e}")

            # Return top-k results
            top_homes: list[dict[str, Any]] = filtered_homes[:top_k]

            return top_homes

        except Exception as e:
            logger.error(f"Error ranking homes: {e}")
            return []

    def compare_scoring_methods(
        self, user_data: dict[str, Any], homes_data: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Compare how different scoring methods rank the same homes."""
        return compare_scoring_methods(
            user_data, homes_data, self.embedding_scorer, self.blend_scores
        )

    def get_ensemble_stats(self) -> dict[str, Any]:
        """Get statistics about ensemble performance."""
        return get_ensemble_stats(self.score_history)

    def _track_scoring_event(
        self,
        request_id: str,
        user_id: str,
        home_id: str,
        embedding_score: float | None = None,
        final_score: float = 0.0,
        rank_position: int | None = None,
        candidate_set_size: int | None = None,
        latency_ms: int | None = None,
        experiment_key: str | None = None,
        experiment_variant: str | None = None,
        session_id: str | None = None,
    ) -> None:
        """Track a scoring event to the database."""
        # Skip tracking if home_id is None or empty (required by database)
        if not home_id:
            logger.debug(
                f"Skipping scoring event tracking: home_id is None or empty (request_id={request_id}, user_id={user_id})"
            )
            return

        from app import db
        from app.models import ScoringResultsTracker

        try:
            # Get embedding model info
            embedding_model_name = self.embedding_model
            if not embedding_model_name:
                from ..embeddings.model_loader import model_loader

                model_info = model_loader.get_model_info(
                    self.embedding_provider, self.embedding_model
                )
                embedding_model_name = model_info.get("model_name", self.embedding_model)

            event = ScoringResultsTracker.create_from_scoring_result(
                request_id=request_id,
                user_id=user_id,
                home_id=home_id,
                embedding_score=embedding_score,
                llm_score=None,
                final_score=final_score,
                embedding_model=embedding_model_name,
                embedding_provider=self.embedding_provider,
                llm_model=None,
                llm_provider=None,
                prompt_version=None,
                weights=None,
                rank_position=rank_position,
                candidate_set_size=candidate_set_size,
                latency_ms=latency_ms,
                experiment_key=experiment_key,
                experiment_variant=experiment_variant,
                session_id=session_id,
            )

            db.session.add(event)
            db.session.commit()

        except Exception as e:
            logger.error(f"Error tracking scoring event: {e}", exc_info=True)
            # Rollback on error
            try:
                db.session.rollback()
            except Exception:
                pass

    def _update_rank_position(self, request_id: str, home_id: str, rank_position: int) -> None:
        """Update rank position for an existing scoring event."""
        from app import db
        from app.models import ScoringResultsTracker

        try:
            event = (
                ScoringResultsTracker.query.filter_by(request_id=request_id, home_id=home_id)
                .order_by(ScoringResultsTracker.created_at.desc())
                .first()
            )

            if event:
                event.rank_position = rank_position
                db.session.commit()

        except Exception as e:
            logger.warning(f"Error updating rank position: {e}")
            try:
                db.session.rollback()
            except Exception:
                pass


# Convenience functions
def blend_scores(embedding_score: float) -> float:
    """Convenience function for scaling embedding score to 0-100."""
    ensemble = EnsembleScorer()
    return ensemble.blend_scores(embedding_score)


def score_user_home_pair(user_data: dict[str, Any], home_data: dict[str, Any]) -> dict[str, Any]:
    """Convenience function for scoring a single user-home pair."""
    ensemble = EnsembleScorer()
    return ensemble.score_user_home_pair(user_data, home_data)
