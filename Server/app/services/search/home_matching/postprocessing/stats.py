"""
Statistics helpers for ensemble scoring.
"""

from typing import Any

import numpy as np

from logger import log


def get_ensemble_stats(score_history: list[dict[str, float]]) -> dict[str, Any]:
    """Get statistics about ensemble performance."""
    try:
        if not score_history:
            return {"message": "No scoring history available"}

        # Convert to numpy arrays
        embedding_scores = [s["embedding"] for s in score_history]
        final_scores = [s["final"] for s in score_history]

        stats = {
            "total_predictions": len(score_history),
            "score_statistics": {
                "embedding": {
                    "mean": float(np.mean(embedding_scores)),
                    "std": float(np.std(embedding_scores)),
                    "min": float(np.min(embedding_scores)),
                    "max": float(np.max(embedding_scores)),
                },
                "ensemble": {
                    "mean": float(np.mean(final_scores)),
                    "std": float(np.std(final_scores)),
                    "min": float(np.min(final_scores)),
                    "max": float(np.max(final_scores)),
                },
            },
        }

        return stats

    except Exception as e:
        log.error("ERRORS", f"Error getting ensemble stats: {e}")
        return {"error": str(e)}
