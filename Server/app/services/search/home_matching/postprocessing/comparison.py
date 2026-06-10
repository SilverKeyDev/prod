"""
Comparison and correlation analysis helpers for ensemble scoring.
"""

from typing import Any

import numpy as np

from logger import log

from .batch_scoring import get_embedding_scores_batch


def calculate_score_correlations(
    embedding_scores: list[float], ensemble_scores: list[float]
) -> dict[str, float]:
    """Calculate correlations between different scoring methods."""
    try:
        correlations = {}

        # Convert to numpy arrays
        emb_arr = np.array(embedding_scores)
        ens_arr = np.array(ensemble_scores)

        # Calculate correlations
        correlations["embedding_vs_ensemble"] = float(np.corrcoef(emb_arr, ens_arr)[0, 1])

        # Handle NaN values (when all scores are the same)
        for key, value in correlations.items():
            if np.isnan(value):
                correlations[key] = 0.0

        return correlations

    except Exception as e:
        log.error("ERRORS", f"Error calculating correlations: {e}")
        return {}


def rank_by_scores(data: list[dict[str, Any]], score_field: str) -> list[dict[str, Any]]:
    """Rank homes by a specific score field."""
    try:
        # Sort by score (highest first)
        sorted_data = sorted(data, key=lambda x: x.get(score_field, 0.0), reverse=True)

        # Add ranks
        for i, item in enumerate(sorted_data):
            item["rank"] = i + 1

        return sorted_data

    except Exception as e:
        log.error("ERRORS", f"Error ranking by {score_field}: {e}")
        return data


def compare_scoring_methods(
    user_data: dict[str, Any], homes_data: list[dict[str, Any]], embedding_scorer, blend_scores_func
) -> dict[str, Any]:
    """Compare how different scoring methods rank the same homes."""
    try:
        if not homes_data:
            return {"error": "No homes provided"}

        # Get scores from embedding method
        embedding_scores = get_embedding_scores_batch(embedding_scorer, user_data, homes_data)

        # Calculate ensemble scores (scaled to 0-100)
        ensemble_scores = []
        for i in range(len(homes_data)):
            emb_score = embedding_scores[i] if i < len(embedding_scores) else 0.0
            ensemble_score = blend_scores_func(emb_score)
            ensemble_scores.append(ensemble_score)

        # Create comparison data
        comparison_data = []
        for i, home_data in enumerate(homes_data):
            comparison_data.append(
                {
                    "home_id": home_data.get("home_id", f"home_{i}"),
                    "embedding_score": embedding_scores[i] if i < len(embedding_scores) else 0.0,
                    "ensemble_score": ensemble_scores[i],
                }
            )

        # Calculate correlations
        correlations = calculate_score_correlations(embedding_scores, ensemble_scores)

        # Rank by each method
        rankings = {
            "embedding": rank_by_scores(comparison_data, "embedding_score"),
            "ensemble": rank_by_scores(comparison_data, "ensemble_score"),
        }

        return {
            "comparison_data": comparison_data,
            "correlations": correlations,
            "rankings": rankings,
        }

    except Exception as e:
        log.error("ERRORS", f"Error comparing scoring methods: {e}")
        return {"error": str(e)}
