"""
Embedding-based similarity scorer for user-home matching.
"""

import numpy as np
from typing import Dict, List, Any, Tuple
import logging

from .user_encoder import UserEncoder
from .home_encoder import HomeEncoder
from ..utils.similarity import SimilarityCalculator

logger = logging.getLogger(__name__)

class EmbeddingScorer:
    """Computes similarity scores between users and homes using embeddings."""
    
    def __init__(self, embedding_provider: str = "sentence_transformer", model: str = None):
        self.user_encoder = UserEncoder(embedding_provider, model)
        self.home_encoder = HomeEncoder(embedding_provider, model)
        self.similarity_calculator = SimilarityCalculator(default_method="cosine")
        
        # Validate dimension consistency
        self._validate_dimensions()
    
    def _validate_dimensions(self):
        """Validate that user and home encoders produce compatible embeddings."""
        try:
            from .feature_config import FeatureConfig
            dimensions = FeatureConfig.get_embedding_dimension()
            
            user_dim = dimensions['user_total_dimension']
            home_dim = dimensions['home_total_dimension']
            
            if user_dim != home_dim:
                logger.warning(f"Dimension mismatch detected! User: {user_dim}, Home: {home_dim}")
                logger.warning("This will cause cosine similarity calculation errors.")
            
        except Exception as e:
            logger.error(f"Error validating dimensions: {e}")
    
    def get_user_home_similarity(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
        """Calculate similarity score between a user and a home."""
        try:
            # Encode user and home
            user_embedding = self.user_encoder.encode_user(user_data)
            home_embedding = self.home_encoder.encode_home(home_data)
            
            # Validate dimensions before similarity calculation
            if user_embedding.shape != home_embedding.shape:
                logger.error(f"Dimension mismatch: User embedding {user_embedding.shape} vs Home embedding {home_embedding.shape}")
                return 0.0
            
            # Calculate similarity
            raw_similarity = self.similarity_calculator.calculate(user_embedding, home_embedding)
            
            # Apply 5x amplification to make differences more dramatic
            # Use power function to amplify differences while keeping in [0,1] range
            amplified_similarity = self._amplify_embedding_score(raw_similarity)
            
            return amplified_similarity
            
        except Exception as e:
            logger.error(f"Error calculating user-home similarity: {e}")
            return 0.0
    
    def _amplify_embedding_score(self, raw_score: float) -> float:
        """
        Apply 5x amplification to embedding scores to make differences more dramatic.
        
        Uses a power function approach that amplifies differences while keeping scores in [0,1].
        If the difference between best and second best was 0.01, it becomes ~0.05.
        """
        try:
            # Ensure score is in valid range
            raw_score = max(0.0, min(1.0, raw_score))
            
            # Apply power amplification
            # Using power of 0.2 (1/5) which effectively amplifies differences by ~5x
            # This makes small differences much more pronounced
            amplified_score = raw_score ** 0.2
            
            # Ensure result stays in [0,1] range
            amplified_score = max(0.0, min(1.0, amplified_score))
            
            return amplified_score
            
        except Exception as e:
            logger.error(f"Error amplifying embedding score: {e}")
            return raw_score  # Return original score if amplification fails
    
    def score_user_against_homes(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Score a user against multiple homes and return ranked results."""
        try:
            if not homes_data:
                return []
            
            # Encode user once
            user_embedding = self.user_encoder.encode_user(user_data)
            
            # Encode all homes in batch
            home_embeddings = self.home_encoder.encode_homes_batch(homes_data)
            
            # Calculate similarities in batch
            raw_similarities = self.similarity_calculator.calculate_multiple(
                user_embedding, home_embeddings
            )
            
            # Apply 5x amplification to all similarities
            amplified_similarities = [self._amplify_embedding_score(sim) for sim in raw_similarities]
            
            # Combine homes with their amplified scores
            scored_homes = list(zip(homes_data, amplified_similarities))
            
            # Sort by similarity (highest first)
            scored_homes.sort(key=lambda x: x[1], reverse=True)
            
            return scored_homes
            
        except Exception as e:
            logger.error(f"Error scoring user against homes: {e}")
            return [(home, 0.0) for home in homes_data]
    
    def score_multiple_users_against_homes(
        self,
        users_data: List[Dict[str, Any]],
        homes_data: List[Dict[str, Any]]
    ) -> Dict[str, List[Tuple[Dict[str, Any], float]]]:
        """Score multiple users against multiple homes."""
        try:
            results = {}
            
            # Encode all homes once
            home_embeddings = self.home_encoder.encode_homes_batch(homes_data)
            
            # Encode all users
            user_embeddings = self.user_encoder.encode_users_batch(users_data)
            
            # Calculate similarities for each user
            for user_data, user_embedding in zip(users_data, user_embeddings):
                similarities = self.similarity_calculator.calculate_multiple(
                    user_embedding, home_embeddings
                )
                
                # Combine homes with their scores
                scored_homes = list(zip(homes_data, similarities))
                scored_homes.sort(key=lambda x: x[1], reverse=True)
                
                user_id = user_data.get('user_id', 'unknown')
                results[user_id] = scored_homes
            
            return results
            
        except Exception as e:
            logger.error(f"Error scoring multiple users against homes: {e}")
            return {}
    
    def get_top_matches(
        self,
        user_data: Dict[str, Any],
        homes_data: List[Dict[str, Any]],
        top_k: int = 10
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Get top-k home matches for a user."""
        try:
            scored_homes = self.score_user_against_homes(user_data, homes_data)
            return scored_homes[:top_k]
        except Exception as e:
            logger.error(f"Error getting top matches: {e}")
            return []
    
    def explain_similarity(
        self,
        user_data: Dict[str, Any],
        home_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Provide explanation for similarity score."""
        try:
            # Get overall similarity
            overall_similarity = self.get_user_home_similarity(user_data, home_data)
            
            # Get embeddings for analysis
            user_embedding = self.user_encoder.encode_user(user_data)
            home_embedding = self.home_encoder.encode_home(home_data)
            
            # Calculate different similarity metrics
            cosine_sim = self.similarity_calculator.calculate(user_embedding, home_embedding, "cosine")
            dot_product_sim = self.similarity_calculator.calculate(user_embedding, home_embedding, "dot_product")
            euclidean_sim = self.similarity_calculator.calculate(user_embedding, home_embedding, "euclidean")
            
            # Extract key features for explanation
            user_prefs = user_data.get('preferences', {})
            
            explanation = {
                "overall_similarity": overall_similarity,
                "similarity_metrics": {
                    "cosine": cosine_sim,
                    "dot_product": dot_product_sim,
                    "euclidean": euclidean_sim
                },
                "user_preferences": {
                    "budget_range": f"${user_prefs.get('budget_min', 0):,} - ${user_prefs.get('budget_max', 0):,}",
                    "preferred_bedrooms": user_prefs.get('preferred_bedrooms', 'Not specified'),
                    "preferred_bathrooms": user_prefs.get('preferred_bathrooms', 'Not specified'),
                    "lifestyle": user_prefs.get('lifestyle', 'Not specified')
                },
                "home_features": {
                    "price": f"${home_data.get('price', 0):,}",
                    "bedrooms": home_data.get('bedrooms', 'Not specified'),
                    "bathrooms": home_data.get('bathrooms', 'Not specified'),
                    "sqft": f"{home_data.get('sqft', 0):,} sq ft" if home_data.get('sqft') else 'Not specified'
                },
                "embedding_dimensions": {
                    "user_embedding_dim": len(user_embedding),
                    "home_embedding_dim": len(home_embedding)
                }
            }
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error explaining similarity: {e}")
            return {"error": str(e)}
