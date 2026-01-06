"""
Batch scoring helpers for ensemble scoring.
"""
from typing import Dict, List, Any, Union
import logging

logger = logging.getLogger(__name__)


def get_embedding_scores_batch(
    embedding_scorer,
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]]
) -> List[float]:
    """Get embedding scores for multiple homes."""
    try:
        scored_homes = embedding_scorer.score_user_against_homes(user_data, homes_data)
        return [score for _, score in scored_homes]
    except Exception as e:
        logger.error(f"Batch embedding scoring failed: {e}")
        return [0.0] * len(homes_data)


def get_llm_scores_batch(
    llm_scorer,
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]],
    include_explanations: bool = False
) -> List[Union[float, Dict[str, Any]]]:
    """Get LLM scores for multiple homes."""
    try:
        if include_explanations:
            # Get detailed explanations (slower)
            scored_results = llm_scorer.score_user_against_homes(user_data, homes_data)
            return [explanation for _, _, explanation in scored_results]
        else:
            # Get just scores (faster)
            return llm_scorer.batch_score_homes(user_data, homes_data)
    except Exception as e:
        logger.error(f"Batch LLM scoring failed: {e}")
        if include_explanations:
            return [{'score': 0.0, 'error': str(e)}] * len(homes_data)
        else:
            return [0.0] * len(homes_data)


def score_home_batch(
    user_data: Dict[str, Any],
    batch_start_idx: int,
    batch_homes: List[Dict[str, Any]],
    embedding_scorer,
    llm_scorer,
    blend_scores_func,
    include_explanations: bool = False
) -> List[Dict[str, Any]]:
    """Score a batch of homes concurrently."""
    try:
        # Get scores for this batch using existing batch methods
        embedding_scores = get_embedding_scores_batch(embedding_scorer, user_data, batch_homes)
        llm_scores = get_llm_scores_batch(llm_scorer, user_data, batch_homes, include_explanations)
        
        # Combine scores for each home in the batch
        batch_results = []
        for i, home_data in enumerate(batch_homes):
            try:
                original_idx = batch_start_idx + i
                embedding_score = embedding_scores[i] if i < len(embedding_scores) else 0.0
                
                if include_explanations and isinstance(llm_scores[i], dict):
                    llm_score = llm_scores[i].get('score', 0.0)
                    llm_explanation = llm_scores[i]
                else:
                    llm_score = llm_scores[i] if i < len(llm_scores) else 0.0
                    llm_explanation = None
                
                # Blend scores
                final_score = blend_scores_func(embedding_score, llm_score)
                
                result = {
                    'home_data': home_data,
                    'home_id': home_data.get('home_id', f'home_{original_idx}'),
                    'scores': {
                        'embedding': embedding_score,
                        'llm': llm_score
                    },
                    'final_score': final_score,
                    'rank': 0  # Will be set after sorting
                }
                
                if llm_explanation:
                    result['llm_explanation'] = llm_explanation
                
                batch_results.append(result)
                
            except Exception as e:
                logger.error(f"Error scoring home {batch_start_idx + i}: {e}")
                batch_results.append({
                    'home_data': home_data,
                    'home_id': home_data.get('home_id', f'home_{batch_start_idx + i}'),
                    'final_score': 0.0,
                    'error': str(e)
                })
        
        return batch_results
        
    except Exception as e:
        logger.error(f"Error processing batch starting at index {batch_start_idx}: {e}")
        # Return error results for all homes in the batch
        error_results = []
        for i, home_data in enumerate(batch_homes):
            error_results.append({
                'home_data': home_data,
                'home_id': home_data.get('home_id', f'home_{batch_start_idx + i}'),
                'final_score': 0.0,
                'error': str(e)
            })
        return error_results
