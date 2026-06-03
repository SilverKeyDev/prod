"""
Main entry point for home matching system.
"""

from typing import Any

from logger import log

from ..postprocessing.blend_scores import EnsembleScorer
from ..utils.io import load_multiple_homes, load_user_data
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


def score_single_match(
    user_data: dict[str, Any], home_data: dict[str, Any], include_explanations: bool = True
) -> dict[str, Any]:
    """
    Score a single user-home pair.

    Args:
        user_data: User preferences and profile data
        home_data: Home listing data
        include_explanations: Whether to include detailed explanations (currently unused)

    Returns:
        Detailed scoring result with individual method scores
    """
    try:
        # Extract user_id from user_data for tracking
        user_id = user_data.get("user_id")

        # Initialize ensemble scorer
        ensemble = EnsembleScorer(user_id=user_id)

        # Score the pair
        result = ensemble.score_user_home_pair(
            user_data, home_data, include_explanations=include_explanations
        )

        return result

    except Exception as e:
        log.error("ERRORS", f"Error scoring single match: {e}")
        return {
            "user_id": user_data.get("user_id", "unknown"),
            "home_id": home_data.get("home_id", "unknown"),
            "final_score": 0.0,
            "error": str(e),
        }


def compare_homes_for_user(
    user_data: dict[str, Any],
    homes_data: list[dict[str, Any]],
    include_method_comparison: bool = False,
) -> dict[str, Any]:
    """
    Compare multiple homes for a user with detailed analysis.

    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to compare
        include_method_comparison: Whether to include comparison of scoring methods

    Returns:
        Comprehensive comparison results
    """
    try:
        ensemble = EnsembleScorer()

        # Get ensemble rankings
        ensemble_rankings = ensemble.rank_homes_for_user(
            user_data, homes_data, top_k=len(homes_data), include_explanations=True
        )

        result = {
            "user_id": user_data.get("user_id", "unknown"),
            "total_homes_compared": len(homes_data),
            "ensemble_rankings": ensemble_rankings,
        }

        # Add method comparison if requested
        if include_method_comparison:
            method_comparison = ensemble.compare_scoring_methods(user_data, homes_data)
            result["method_comparison"] = method_comparison

        return result

    except Exception as e:
        log.error("ERRORS", f"Error comparing homes: {e}")
        return {"user_id": user_data.get("user_id", "unknown"), "error": str(e)}


def batch_match_users(
    users_data: list[dict[str, Any]], homes_data: list[dict[str, Any]], top_k: int | None = None
) -> dict[str, list[dict[str, Any]]]:
    """
    Match multiple users against multiple homes.

    Args:
        users_data: List of user preference data
        homes_data: List of home listings
        top_k: Number of top matches per user

    Returns:
        Dictionary mapping user_id to their top matches
    """
    try:
        top_k = top_k or DEFAULT_TOP_K
        results = {}

        ensemble = EnsembleScorer()

        for user_data in users_data:
            user_id = user_data.get("user_id", "unknown")

            try:
                matches = ensemble.rank_homes_for_user(
                    user_data,
                    homes_data,
                    top_k=top_k,
                    include_explanations=False,  # Faster for batch processing
                )
                results[user_id] = matches

            except Exception as e:
                log.error("ERRORS", f"Error matching user {user_id}: {e}")
                results[user_id] = []

        return results

    except Exception as e:
        log.error("ERRORS", f"Error in batch matching: {e}")
        return {}


def load_and_match(
    user_file_path: str,
    homes_directory: str,
    top_k: int | None = None,
    include_explanations: bool = False,
) -> list[dict[str, Any]]:
    """
    Load user and homes data from files and find matches.

    Args:
        user_file_path: Path to user JSON file
        homes_directory: Directory containing home JSON files
        top_k: Number of top matches to return
        include_explanations: Whether to include explanations

    Returns:
        List of top matches
    """
    try:
        # Load data
        user_data = load_user_data(user_file_path)
        homes_data = load_multiple_homes(homes_directory)

        if not homes_data:
            log.warn("SEARCH", "No homes loaded from directory")
            return []

        # Find matches
        matches = find_best_matches(
            user_data, homes_data, top_k=top_k, include_explanations=include_explanations
        )

        return matches

    except Exception as e:
        log.error("ERRORS", f"Error loading and matching: {e}")
        return []


def get_system_info() -> dict[str, Any]:
    """Get information about the matching system."""
    try:
        ensemble = EnsembleScorer()

        info = {
            "system_name": "SilverKey Home Matching System",
            "version": "1.0.0",
            "components": {"embedding_scorer": ensemble.embedding_scorer.__class__.__name__},
            "default_top_k": DEFAULT_TOP_K,
        }

        # Add component-specific info
        try:
            info["embedding_info"] = {
                "dimension": ensemble.embedding_scorer.user_encoder.get_embedding_dimension()
            }
        except Exception:
            info["embedding_info"] = {"status": "not available"}

        return info

    except Exception as e:
        log.error("ERRORS", f"Error getting system info: {e}")
        return {"error": str(e)}


# Main execution for testing
if __name__ == "__main__":
    # Note: Use real data from database via preprocessing module instead of sample data
    log.info("API", "Testing Home Matching System...")
    log.info(
        "API",
        "Note: Use real data from database via preprocessing module for testing",
    )

    # Get system info
    info = get_system_info()
    log.info("API", "System info", {"system_name": info.get("system_name", "Unknown")})

    log.info("API", "Testing completed successfully!")
