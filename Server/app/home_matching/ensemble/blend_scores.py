"""
Ensemble blending logic to combine scores from embedding and LLM methods.
"""
from typing import Dict, List, Any
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..config.settings import EMBEDDING_WEIGHT, LLM_WEIGHT, DEFAULT_TOP_K
from ..embeddings.scorer import EmbeddingScorer
from ..llm_scorer.scorer import LLMScorer

from .batch_scoring import score_home_batch
from .comparison import compare_scoring_methods
from .stats import get_ensemble_stats

logger = logging.getLogger(__name__)


class EnsembleScorer:
    """Combines scores from embedding and LLM models."""
    
    def __init__(
        self,
        embedding_weight: float = None,
        llm_weight: float = None,
        embedding_provider: str = "sentence_transformer",
        embedding_model: str = None,
        llm_provider: str = "openai",
        llm_model: str = None
    ):
        # Set weights
        self.embedding_weight = embedding_weight or EMBEDDING_WEIGHT
        self.llm_weight = llm_weight or LLM_WEIGHT
        
        # Normalize weights to sum to 1
        total_weight = self.embedding_weight + self.llm_weight
        if total_weight != 1.0 and total_weight > 0:
            self.embedding_weight /= total_weight
            self.llm_weight /= total_weight
            logger.info(f"Normalized weights - Embedding: {self.embedding_weight:.3f}, LLM: {self.llm_weight:.3f}")
        
        # Initialize scorers
        self.embedding_scorer = EmbeddingScorer(embedding_provider, embedding_model)
        self.llm_scorer = LLMScorer(llm_provider, llm_model)
        
        # Performance tracking
        self.score_history = []
    
    def blend_scores(
        self,
        embedding_score: float,
        llm_score: float
    ) -> float:
        """Blend scores using weighted average and post-process to 0-100 scale."""
        try:
            # Ensure scores are in [0, 1] range
            embedding_score = max(0.0, min(1.0, embedding_score))
            llm_score = max(0.0, min(1.0, llm_score))
            
            # Calculate weighted contributions
            embedding_contribution = self.embedding_weight * embedding_score
            llm_contribution = self.llm_weight * llm_score
            
            # Calculate final weighted average (0-1 range)
            final_score = embedding_contribution + llm_contribution
            
            # Post-process: scale to 0-100 and round to exactly one decimal place
            scaled_score = final_score * 100.0
            rounded_score = round(scaled_score, 1)
            
            return float(rounded_score)
            
        except Exception as e:
            logger.error(f"Error blending scores: {e}")
            return 0.0
    
    def score_user_home_pair(
        self,
        user_data: Dict[str, Any],
        home_data: Dict[str, Any],
        include_explanations: bool = False
    ) -> Dict[str, Any]:
        """Score a single user-home pair using embedding and LLM methods."""
        try:
            result = {
                'user_id': user_data.get('user_id', 'unknown'),
                'home_id': home_data.get('home_id', 'unknown'),
                'scores': {},
                'final_score': 0.0,
                'method_weights': {
                    'embedding': self.embedding_weight,
                    'llm': self.llm_weight
                }
            }
            
            # Get embedding score
            try:
                embedding_score = self.embedding_scorer.get_user_home_similarity(user_data, home_data)
                result['scores']['embedding'] = embedding_score
            except Exception as e:
                logger.error(f"Embedding scoring failed: {e}")
                result['scores']['embedding'] = 0.0
                result['errors'] = result.get('errors', {})
                result['errors']['embedding'] = str(e)
            
            # Get LLM score
            try:
                if include_explanations:
                    llm_result = self.llm_scorer.llm_score_with_explanation(user_data, home_data)
                    llm_score = llm_result.get('score', 0.0)
                    result['llm_explanation'] = llm_result
                else:
                    llm_score = self.llm_scorer.llm_score(user_data, home_data)
                
                result['scores']['llm'] = llm_score
            except Exception as e:
                logger.error(f"LLM scoring failed: {e}")
                result['scores']['llm'] = 0.0
                result['errors'] = result.get('errors', {})
                result['errors']['llm'] = str(e)
            
            # Blend scores
            final_score = self.blend_scores(
                result['scores']['embedding'],
                result['scores']['llm']
            )
            result['final_score'] = final_score
            
            # Track performance
            self.score_history.append({
                'embedding': result['scores']['embedding'],
                'llm': result['scores']['llm'],
                'final': final_score
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error scoring user-home pair: {e}")
            return {
                'user_id': user_data.get('user_id', 'unknown'),
                'home_id': home_data.get('home_id', 'unknown'),
                'final_score': 0.0,
                'error': str(e)
            }
    
    def rank_homes_for_user(
        self,
        user_data: Dict[str, Any],
        homes_data: List[Dict[str, Any]],
        top_k: int = None,
        include_explanations: bool = False
    ) -> List[Dict[str, Any]]:
        """Rank multiple homes for a user using concurrent ensemble scoring."""
        try:
            top_k = top_k or DEFAULT_TOP_K
            
            if not homes_data:
                return []
                        
            # Divide homes into batches of 3 for concurrent processing
            batch_size = 3
            home_batches = []
            for i in range(0, len(homes_data), batch_size):
                batch = homes_data[i:i + batch_size]
                home_batches.append((i, batch))  # Store original indices for proper ordering
                        
            # Score all batches concurrently
            scored_homes = [None] * len(homes_data)  # Pre-allocate to maintain order
            
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
                        self.llm_scorer,
                        self.blend_scores,
                        include_explanations
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
                        logger.error(f"❌ Error processing batch starting at index {batch_start_idx}: {e}")
                        # Fill with error results
                        for i, home_data in enumerate(batch_homes):
                            scored_homes[batch_start_idx + i] = {
                                'home_data': home_data,
                                'home_id': home_data.get('home_id', f'home_{batch_start_idx + i}'),
                                'final_score': 0.0,
                                'error': str(e)
                            }
            
            # Filter out any None results (shouldn't happen, but safety check)
            scored_homes = [home for home in scored_homes if home is not None]
                            
            # Sort by final score (highest first)
            scored_homes.sort(key=lambda x: x.get('final_score', 0.0), reverse=True)
            
            # Add ranks
            for i, home in enumerate(scored_homes):
                home['rank'] = i + 1
            
            # Return top-k results
            top_homes = scored_homes[:top_k]
            
            return top_homes
            
        except Exception as e:
            logger.error(f"Error ranking homes: {e}")
            return []
    
    def compare_scoring_methods(
        self,
        user_data: Dict[str, Any],
        homes_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compare how different scoring methods rank the same homes."""
        return compare_scoring_methods(
            user_data,
            homes_data,
            self.embedding_scorer,
            self.llm_scorer,
            self.blend_scores,
            {
                'embedding': self.embedding_weight,
                'llm': self.llm_weight
            }
        )
    
    def get_ensemble_stats(self) -> Dict[str, Any]:
        """Get statistics about ensemble performance."""
        return get_ensemble_stats(
            self.score_history,
            {
                'embedding': self.embedding_weight,
                'llm': self.llm_weight
            }
        )


# Convenience functions
def blend_scores(embedding_score: float, llm_score: float) -> float:
    """Convenience function for blending scores with default weights."""
    ensemble = EnsembleScorer()
    return ensemble.blend_scores(embedding_score, llm_score)


def score_user_home_pair(user_data: Dict[str, Any], home_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for scoring a single user-home pair."""
    ensemble = EnsembleScorer()
    return ensemble.score_user_home_pair(user_data, home_data)
