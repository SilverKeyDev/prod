"""
Main entry point for home matching system.
"""

from typing import Any

from logger import log

from ..postprocessing.blend_scores import EnsembleScorer
from .settings import DEFAULT_TOP_K


def find_best_matches(
    user_data: dict[str, Any],
    homes_data: list[dict[str, Any]],
    top_k: int | None = None,
    include_explanations: bool = False,
    embedding_provider: str = "sentence_transformer",
    request_id: str | None = None,
    experiment_key: str | None = None,
    experiment_variant: str | None = None,
    session_id: str | None = None,
    track_to_db: bool = True,
) -> list[dict[str, Any]]:
    """
    Find the best home matches for a user.

    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to match against
        top_k: Number of top matches to return (default: 10)
        include_explanations: Whether to include explanations (currently unused)
        embedding_provider: Embedding model provider ("sentence_transformer" or "openai")
        request_id: Request ID for tracking scoring events
        experiment_key: Experiment key for A/B testing
        experiment_variant: Experiment variant (A/B)
        session_id: Session ID for tracking
        track_to_db: Whether to track scoring events to database

    Returns:
        List of top-k home matches with scores
    """
    try:
        top_k = top_k or DEFAULT_TOP_K

        # Extract user_id from user_data for tracking
        user_id = user_data.get("user_id")

        # Initialize ensemble scorer
        ensemble = EnsembleScorer(embedding_provider=embedding_provider, user_id=user_id)

        # Get ranked matches
        matches = ensemble.rank_homes_for_user(
            user_data,
            homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            request_id=request_id,
            experiment_key=experiment_key,
            experiment_variant=experiment_variant,
            session_id=session_id,
            track_to_db=track_to_db,
        )

        return matches

    except Exception as e:
        log.error("ERRORS", f"Error finding best matches: {e}")
        return []
