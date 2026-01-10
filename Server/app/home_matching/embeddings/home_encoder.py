"""
Home encoder that combines home and neighborhood data into embeddings.
"""

import numpy as np
from typing import Dict, List, Any, Optional
import logging

from .model_loader import model_loader
from ..preprocessing.models.embedding_input import EmbeddingHomeInput

logger = logging.getLogger(__name__)

class HomeEncoder:
    """Encodes home listings into embeddings."""
    
    def __init__(self, embedding_provider: str = "sentence_transformer", model: str = None):
        self.embedding_provider = embedding_provider
        self.model = model
    
    def _extract_structured_features(self, home_data: Dict[str, Any]) -> np.ndarray:
        """Extract structured numerical features from home data using shared config."""
        from .feature_config import FeatureConfig
        return FeatureConfig.extract_home_structured_features(home_data)
    
    def encode_home(self, home_data: Dict[str, Any]) -> np.ndarray:
        """Encode home data into embedding."""
        try:
            # Convert to preprocessing model
            embedding_home = EmbeddingHomeInput.from_dict(home_data)
            
            # Extract text features using the model's method
            text_features = embedding_home.extract_text_features()
            
            if text_features.strip():
                text_embedding = model_loader.get_embedding(
                    text_features,
                    provider=self.embedding_provider,
                    model=self.model
                )
            else:
                # If no text features, create zero embedding
                model_info = model_loader.get_model_info(self.embedding_provider, self.model)
                embedding_dim = model_info.get('dimension', 384)
                text_embedding = np.zeros(embedding_dim)
            
            # Extract structured features using the model's method
            structured_features = self._extract_structured_features(embedding_home.to_dict())
            
            # Combine text and structured embeddings
            combined_embedding = np.concatenate([text_embedding, structured_features])
            
            return combined_embedding
            
        except Exception as e:
            logger.error(f"Error encoding home data: {e}")
            raise
    
    def encode_homes_batch(self, homes_data: List[Dict[str, Any]]) -> List[np.ndarray]:
        """Encode multiple homes into embeddings."""
        try:
            embeddings = []
            
            # Extract all text features first using preprocessing models
            text_features_list = []
            structured_features_list = []
            
            for home_data in homes_data:
                # Convert to preprocessing model
                embedding_home = EmbeddingHomeInput.from_dict(home_data)
                text_features = embedding_home.extract_text_features()
                structured_features = self._extract_structured_features(embedding_home.to_dict())
                
                text_features_list.append(text_features)
                structured_features_list.append(structured_features)
            
            # Get text embeddings in batch
            non_empty_texts = [text for text in text_features_list if text.strip()]
            if non_empty_texts:
                text_embeddings = model_loader.get_embeddings_batch(
                    non_empty_texts,
                    provider=self.embedding_provider,
                    model=self.model
                )
            else:
                text_embeddings = []
            
            # Combine embeddings
            text_idx = 0
            for i, (text_features, structured_features) in enumerate(zip(text_features_list, structured_features_list)):
                if text_features.strip():
                    text_embedding = text_embeddings[text_idx]
                    text_idx += 1
                else:
                    # Create zero embedding for empty text
                    model_info = model_loader.get_model_info(self.embedding_provider, self.model)
                    embedding_dim = model_info.get('dimension', 384)
                    text_embedding = np.zeros(embedding_dim)
                
                # Combine text and structured embeddings
                combined_embedding = np.concatenate([text_embedding, structured_features])
                embeddings.append(combined_embedding)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error encoding homes batch: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the combined embedding."""
        try:
            from .feature_config import FeatureConfig
            dimensions = FeatureConfig.get_embedding_dimension(self.embedding_provider, self.model)
            return dimensions['home_total_dimension']
        except Exception as e:
            logger.error(f"Error getting embedding dimension: {e}")
            return 399  # Fallback dimension
            return 384 + 14  # Default fallback
