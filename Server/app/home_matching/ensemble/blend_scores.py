"""
Ensemble blending logic to combine scores from all three methods.
"""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional, Union
import logging

from ..config.settings import EMBEDDING_WEIGHT, TABULAR_WEIGHT, LLM_WEIGHT, DEFAULT_TOP_K
from ..embeddings.scorer import EmbeddingScorer
from ..tabular_model.predict import TabularPredictor
from ..llm_scorer.scorer import LLMScorer

logger = logging.getLogger(__name__)

class EnsembleScorer:
    """Combines scores from embedding, tabular, and LLM models."""
    
    def __init__(
        self,
        embedding_weight: float = None,
        tabular_weight: float = None,
        llm_weight: float = None,
        embedding_provider: str = "sentence_transformer",
        embedding_model: str = None,
        tabular_model_path: str = None,
        llm_provider: str = "openai",
        llm_model: str = None
    ):
        # Set weights
        self.embedding_weight = embedding_weight or EMBEDDING_WEIGHT
        self.tabular_weight = tabular_weight or TABULAR_WEIGHT
        self.llm_weight = llm_weight or LLM_WEIGHT
        
        # Normalize weights to sum to 1
        total_weight = self.embedding_weight + self.tabular_weight + self.llm_weight
        if total_weight != 1.0:
            self.embedding_weight /= total_weight
            self.tabular_weight /= total_weight
            self.llm_weight /= total_weight
            logger.info(f"Normalized weights - Embedding: {self.embedding_weight:.3f}, Tabular: {self.tabular_weight:.3f}, LLM: {self.llm_weight:.3f}")
        
        # Initialize scorers
        self.embedding_scorer = EmbeddingScorer(embedding_provider, embedding_model)
        self.tabular_predictor = TabularPredictor(tabular_model_path)
        self.llm_scorer = LLMScorer(llm_provider, llm_model)
        
        # Performance tracking
        self.score_history = []
    
    def blend_scores(
        self,
        embedding_score: float,
        tabular_score: float,
        llm_score: float
    ) -> float:
        """Blend three scores using weighted average."""
        try:
            # Ensure scores are in [0, 1] range
            embedding_score = max(0.0, min(1.0, embedding_score))
            tabular_score = max(0.0, min(1.0, tabular_score))
            llm_score = max(0.0, min(1.0, llm_score))
            
            # Calculate weighted contributions
            embedding_contribution = self.embedding_weight * embedding_score
            tabular_contribution = self.tabular_weight * tabular_score
            llm_contribution = self.llm_weight * llm_score
            
            # Calculate final weighted average
            final_score = embedding_contribution + tabular_contribution + llm_contribution
            
            # Log detailed weight breakdown for each property scored
            logger.info(
                f"🎯 Score blend - "
                f"Embedding: {embedding_score:.4f} × {self.embedding_weight:.3f} = {embedding_contribution:.4f}, "
                f"Tabular: {tabular_score:.4f} × {self.tabular_weight:.3f} = {tabular_contribution:.4f}, "
                f"LLM: {llm_score:.4f} × {self.llm_weight:.3f} = {llm_contribution:.4f}, "
                f"Total: {final_score:.4f}"
            )
            
            return float(final_score)
            
        except Exception as e:
            logger.error(f"Error blending scores: {e}")
            return 0.0
    
    def score_user_home_pair(
        self,
        user_data: Dict[str, Any],
        home_data: Dict[str, Any],
        include_explanations: bool = False
    ) -> Dict[str, Any]:
        """Score a single user-home pair using all three methods."""
        try:
            result = {
                'user_id': user_data.get('user_id', 'unknown'),
                'home_id': home_data.get('home_id', 'unknown'),
                'scores': {},
                'final_score': 0.0,
                'method_weights': {
                    'embedding': self.embedding_weight,
                    'tabular': self.tabular_weight,
                    'llm': self.llm_weight
                }
            }
            
            # Get embedding score
            try:
                embedding_score = self.embedding_scorer.get_user_home_similarity(user_data, home_data)
                result['scores']['embedding'] = embedding_score
                logger.debug(f"Embedding score: {embedding_score:.3f}")
            except Exception as e:
                logger.error(f"Embedding scoring failed: {e}")
                result['scores']['embedding'] = 0.0
                result['errors'] = result.get('errors', {})
                result['errors']['embedding'] = str(e)
            
            # Get tabular score
            try:
                tabular_score = self.tabular_predictor.predict_match_score(user_data, home_data)
                result['scores']['tabular'] = tabular_score
                logger.debug(f"Tabular score: {tabular_score:.3f}")
            except Exception as e:
                logger.error(f"Tabular scoring failed: {e}")
                result['scores']['tabular'] = 0.0
                result['errors'] = result.get('errors', {})
                result['errors']['tabular'] = str(e)
            
            # Get LLM score
            try:
                if include_explanations:
                    llm_result = self.llm_scorer.llm_score_with_explanation(user_data, home_data)
                    llm_score = llm_result.get('score', 0.0)
                    result['llm_explanation'] = llm_result
                else:
                    llm_score = self.llm_scorer.llm_score(user_data, home_data)
                
                result['scores']['llm'] = llm_score
                logger.debug(f"LLM score: {llm_score:.3f}")
            except Exception as e:
                logger.error(f"LLM scoring failed: {e}")
                result['scores']['llm'] = 0.0
                result['errors'] = result.get('errors', {})
                result['errors']['llm'] = str(e)
            
            # Blend scores
            final_score = self.blend_scores(
                result['scores']['embedding'],
                result['scores']['tabular'],
                result['scores']['llm']
            )
            result['final_score'] = final_score
            
            # Track performance
            self.score_history.append({
                'embedding': result['scores']['embedding'],
                'tabular': result['scores']['tabular'],
                'llm': result['scores']['llm'],
                'final': final_score
            })
            
            logger.info(f"Final ensemble score: {final_score:.3f} for user {result['user_id']} and home {result['home_id']}")
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
        """Rank multiple homes for a user using ensemble scoring."""
        try:
            top_k = top_k or DEFAULT_TOP_K
            
            if not homes_data:
                return []
            
            # Score all homes
            scored_homes = []
            
            # Batch processing for efficiency
            embedding_scores = self._get_embedding_scores_batch(user_data, homes_data)
            tabular_scores = self._get_tabular_scores_batch(user_data, homes_data)
            llm_scores = self._get_llm_scores_batch(user_data, homes_data, include_explanations)
            
            # Combine scores
            for i, home_data in enumerate(homes_data):
                try:
                    embedding_score = embedding_scores[i] if i < len(embedding_scores) else 0.0
                    tabular_score = tabular_scores[i] if i < len(tabular_scores) else 0.0
                    
                    if include_explanations and isinstance(llm_scores[i], dict):
                        llm_score = llm_scores[i].get('score', 0.0)
                        llm_explanation = llm_scores[i]
                    else:
                        llm_score = llm_scores[i] if i < len(llm_scores) else 0.0
                        llm_explanation = None
                    
                    # Blend scores
                    final_score = self.blend_scores(embedding_score, tabular_score, llm_score)
                    
                    result = {
                        'home_data': home_data,
                        'home_id': home_data.get('home_id', f'home_{i}'),
                        'scores': {
                            'embedding': embedding_score,
                            'tabular': tabular_score,
                            'llm': llm_score
                        },
                        'final_score': final_score,
                        'rank': 0  # Will be set after sorting
                    }
                    
                    if llm_explanation:
                        result['llm_explanation'] = llm_explanation
                    
                    scored_homes.append(result)
                    
                except Exception as e:
                    logger.error(f"Error scoring home {i}: {e}")
                    scored_homes.append({
                        'home_data': home_data,
                        'home_id': home_data.get('home_id', f'home_{i}'),
                        'final_score': 0.0,
                        'error': str(e)
                    })
            
            # Sort by final score (highest first)
            scored_homes.sort(key=lambda x: x.get('final_score', 0.0), reverse=True)
            
            # Add ranks
            for i, home in enumerate(scored_homes):
                home['rank'] = i + 1
            
            # Return top-k results
            top_homes = scored_homes[:top_k]
            
            logger.info(f"Ranked {len(homes_data)} homes for user {user_data.get('user_id', 'unknown')}, returning top {len(top_homes)}")
            return top_homes
            
        except Exception as e:
            logger.error(f"Error ranking homes: {e}")
            return []
    
    def _get_embedding_scores_batch(self, user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> List[float]:
        """Get embedding scores for multiple homes."""
        try:
            scored_homes = self.embedding_scorer.score_user_against_homes(user_data, homes_data)
            return [score for _, score in scored_homes]
        except Exception as e:
            logger.error(f"Batch embedding scoring failed: {e}")
            return [0.0] * len(homes_data)
    
    def _get_tabular_scores_batch(self, user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> List[float]:
        """Get tabular scores for multiple homes."""
        try:
            return self.tabular_predictor.predict_batch(user_data, homes_data)
        except Exception as e:
            logger.error(f"Batch tabular scoring failed: {e}")
            return [0.0] * len(homes_data)
    
    def _get_llm_scores_batch(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]], 
        include_explanations: bool = False
    ) -> List[Union[float, Dict[str, Any]]]:
        """Get LLM scores for multiple homes."""
        try:
            if include_explanations:
                # Get detailed explanations (slower)
                scored_results = self.llm_scorer.score_user_against_homes(user_data, homes_data)
                return [explanation for _, _, explanation in scored_results]
            else:
                # Get just scores (faster)
                return self.llm_scorer.batch_score_homes(user_data, homes_data)
        except Exception as e:
            logger.error(f"Batch LLM scoring failed: {e}")
            if include_explanations:
                return [{'score': 0.0, 'error': str(e)}] * len(homes_data)
            else:
                return [0.0] * len(homes_data)
    
    def compare_scoring_methods(
        self,
        user_data: Dict[str, Any],
        homes_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compare how different scoring methods rank the same homes."""
        try:
            if not homes_data:
                return {'error': 'No homes provided'}
            
            # Get scores from all methods
            embedding_scores = self._get_embedding_scores_batch(user_data, homes_data)
            tabular_scores = self._get_tabular_scores_batch(user_data, homes_data)
            llm_scores = self._get_llm_scores_batch(user_data, homes_data)
            
            # Calculate ensemble scores
            ensemble_scores = []
            for i in range(len(homes_data)):
                emb_score = embedding_scores[i] if i < len(embedding_scores) else 0.0
                tab_score = tabular_scores[i] if i < len(tabular_scores) else 0.0
                llm_score = llm_scores[i] if i < len(llm_scores) else 0.0
                
                ensemble_score = self.blend_scores(emb_score, tab_score, llm_score)
                ensemble_scores.append(ensemble_score)
            
            # Create comparison data
            comparison_data = []
            for i, home_data in enumerate(homes_data):
                comparison_data.append({
                    'home_id': home_data.get('home_id', f'home_{i}'),
                    'embedding_score': embedding_scores[i] if i < len(embedding_scores) else 0.0,
                    'tabular_score': tabular_scores[i] if i < len(tabular_scores) else 0.0,
                    'llm_score': llm_scores[i] if i < len(llm_scores) else 0.0,
                    'ensemble_score': ensemble_scores[i]
                })
            
            # Calculate correlations
            correlations = self._calculate_score_correlations(
                embedding_scores, tabular_scores, llm_scores, ensemble_scores
            )
            
            # Rank by each method
            rankings = {
                'embedding': self._rank_by_scores(comparison_data, 'embedding_score'),
                'tabular': self._rank_by_scores(comparison_data, 'tabular_score'),
                'llm': self._rank_by_scores(comparison_data, 'llm_score'),
                'ensemble': self._rank_by_scores(comparison_data, 'ensemble_score')
            }
            
            return {
                'comparison_data': comparison_data,
                'correlations': correlations,
                'rankings': rankings,
                'method_weights': {
                    'embedding': self.embedding_weight,
                    'tabular': self.tabular_weight,
                    'llm': self.llm_weight
                }
            }
            
        except Exception as e:
            logger.error(f"Error comparing scoring methods: {e}")
            return {'error': str(e)}
    
    def _calculate_score_correlations(
        self,
        embedding_scores: List[float],
        tabular_scores: List[float],
        llm_scores: List[float],
        ensemble_scores: List[float]
    ) -> Dict[str, float]:
        """Calculate correlations between different scoring methods."""
        try:
            correlations = {}
            
            # Convert to numpy arrays
            emb_arr = np.array(embedding_scores)
            tab_arr = np.array(tabular_scores)
            llm_arr = np.array(llm_scores)
            ens_arr = np.array(ensemble_scores)
            
            # Calculate correlations
            correlations['embedding_vs_tabular'] = float(np.corrcoef(emb_arr, tab_arr)[0, 1])
            correlations['embedding_vs_llm'] = float(np.corrcoef(emb_arr, llm_arr)[0, 1])
            correlations['tabular_vs_llm'] = float(np.corrcoef(tab_arr, llm_arr)[0, 1])
            correlations['embedding_vs_ensemble'] = float(np.corrcoef(emb_arr, ens_arr)[0, 1])
            correlations['tabular_vs_ensemble'] = float(np.corrcoef(tab_arr, ens_arr)[0, 1])
            correlations['llm_vs_ensemble'] = float(np.corrcoef(llm_arr, ens_arr)[0, 1])
            
            # Handle NaN values (when all scores are the same)
            for key, value in correlations.items():
                if np.isnan(value):
                    correlations[key] = 0.0
            
            return correlations
            
        except Exception as e:
            logger.error(f"Error calculating correlations: {e}")
            return {}
    
    def _rank_by_scores(self, data: List[Dict[str, Any]], score_field: str) -> List[Dict[str, Any]]:
        """Rank homes by a specific score field."""
        try:
            # Sort by score (highest first)
            sorted_data = sorted(data, key=lambda x: x.get(score_field, 0.0), reverse=True)
            
            # Add ranks
            for i, item in enumerate(sorted_data):
                item['rank'] = i + 1
            
            return sorted_data
            
        except Exception as e:
            logger.error(f"Error ranking by {score_field}: {e}")
            return data
    
    def get_ensemble_stats(self) -> Dict[str, Any]:
        """Get statistics about ensemble performance."""
        try:
            if not self.score_history:
                return {'message': 'No scoring history available'}
            
            # Convert to numpy arrays
            embedding_scores = [s['embedding'] for s in self.score_history]
            tabular_scores = [s['tabular'] for s in self.score_history]
            llm_scores = [s['llm'] for s in self.score_history]
            final_scores = [s['final'] for s in self.score_history]
            
            stats = {
                'total_predictions': len(self.score_history),
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
                'method_weights': {
                    'embedding': self.embedding_weight,
                    'tabular': self.tabular_weight,
                    'llm': self.llm_weight
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting ensemble stats: {e}")
            return {'error': str(e)}

# Convenience functions
def blend_scores(embedding_score: float, tabular_score: float, llm_score: float) -> float:
    """Convenience function for blending scores with default weights."""
    ensemble = EnsembleScorer()
    return ensemble.blend_scores(embedding_score, tabular_score, llm_score)

def score_user_home_pair(user_data: Dict[str, Any], home_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for scoring a single user-home pair."""
    ensemble = EnsembleScorer()
    return ensemble.score_user_home_pair(user_data, home_data)
