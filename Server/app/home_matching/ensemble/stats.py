"""
Statistics helpers for ensemble scoring.
"""
import numpy as np
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


def get_ensemble_stats(
    score_history: List[Dict[str, float]],
    method_weights: Dict[str, float]
) -> Dict[str, Any]:
    """Get statistics about ensemble performance."""
    try:
        if not score_history:
            return {'message': 'No scoring history available'}
        
        # Convert to numpy arrays
        embedding_scores = [s['embedding'] for s in score_history]
        tabular_scores = [s['tabular'] for s in score_history]
        llm_scores = [s['llm'] for s in score_history]
        final_scores = [s['final'] for s in score_history]
        
        stats = {
            'total_predictions': len(score_history),
            'score_statistics': {
                'embedding': {
                    'mean': float(np.mean(embedding_scores)),
                    'std': float(np.std(embedding_scores)),
                    'min': float(np.min(embedding_scores)),
                    'max': float(np.max(embedding_scores))
                },
                'tabular': {
                    'mean': float(np.mean(tabular_scores)),
                    'std': float(np.std(tabular_scores)),
                    'min': float(np.min(tabular_scores)),
                    'max': float(np.max(tabular_scores))
                },
                'llm': {
                    'mean': float(np.mean(llm_scores)),
                    'std': float(np.std(llm_scores)),
                    'min': float(np.min(llm_scores)),
                    'max': float(np.max(llm_scores))
                },
                'ensemble': {
                    'mean': float(np.mean(final_scores)),
                    'std': float(np.std(final_scores)),
                    'min': float(np.min(final_scores)),
                    'max': float(np.max(final_scores))
                }
            },
            'method_weights': method_weights
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting ensemble stats: {e}")
        return {'error': str(e)}
