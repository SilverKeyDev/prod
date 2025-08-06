"""
Home encoder that combines home and neighborhood data into embeddings.
"""

import numpy as np
from typing import Dict, List, Any, Optional
import logging

from .model_loader import model_loader
from ..utils.preprocessing import DataPreprocessor

logger = logging.getLogger(__name__)

class HomeEncoder:
    """Encodes home listings into embeddings."""
    
    def __init__(self, embedding_provider: str = "sentence_transformer", model: str = None):
        self.embedding_provider = embedding_provider
        self.model = model
        self.preprocessor = DataPreprocessor()
    
    def _extract_text_features(self, home_data: Dict[str, Any]) -> str:
        """Extract and combine text features from home data."""
        text_parts = []
        
        # Basic property info
        if 'address' in home_data:
            text_parts.append(f"Address: {home_data['address']}")
        
        if 'description' in home_data:
            text_parts.append(f"Description: {home_data['description']}")
        
        # Property characteristics
        if 'home_type' in home_data:
            text_parts.append(f"Home type: {home_data['home_type']}")
        
        if 'style' in home_data:
            text_parts.append(f"Architectural style: {home_data['style']}")
        
        if 'condition' in home_data:
            text_parts.append(f"Condition: {home_data['condition']}")
        
        # Size and layout
        bedrooms = home_data.get('bedrooms', 0)
        bathrooms = home_data.get('bathrooms', 0)
        sqft = home_data.get('sqft', 0)
        
        if bedrooms > 0:
            text_parts.append(f"{bedrooms} bedrooms")
        if bathrooms > 0:
            text_parts.append(f"{bathrooms} bathrooms")
        if sqft > 0:
            text_parts.append(f"{sqft} square feet")
        
        # Amenities and features
        if 'amenities' in home_data and home_data['amenities']:
            if isinstance(home_data['amenities'], list):
                amenities = ', '.join(home_data['amenities'])
            else:
                amenities = str(home_data['amenities'])
            text_parts.append(f"Amenities: {amenities}")
        
        if 'features' in home_data and home_data['features']:
            if isinstance(home_data['features'], list):
                features = ', '.join(home_data['features'])
            else:
                features = str(home_data['features'])
            text_parts.append(f"Features: {features}")
        
        # Neighborhood information
        if 'neighborhood' in home_data:
            text_parts.append(f"Neighborhood: {home_data['neighborhood']}")
        
        if 'neighborhood_info' in home_data:
            text_parts.append(f"Neighborhood info: {home_data['neighborhood_info']}")
        
        if 'school_district' in home_data:
            text_parts.append(f"School district: {home_data['school_district']}")
        
        # Location characteristics
        if 'walkability_score' in home_data:
            score = home_data['walkability_score']
            text_parts.append(f"Walkability score: {score}")
        
        if 'transit_score' in home_data:
            score = home_data['transit_score']
            text_parts.append(f"Transit score: {score}")
        
        # Nearby amenities
        if 'nearby_amenities' in home_data and home_data['nearby_amenities']:
            if isinstance(home_data['nearby_amenities'], list):
                nearby = ', '.join(home_data['nearby_amenities'])
            else:
                nearby = str(home_data['nearby_amenities'])
            text_parts.append(f"Nearby: {nearby}")
        
        return ' '.join(text_parts)
    
    def _extract_structured_features(self, home_data: Dict[str, Any]) -> np.ndarray:
        """Extract structured numerical features from home data using shared config."""
        from .feature_config import FeatureConfig
        return FeatureConfig.extract_home_structured_features(home_data)
    
    def encode_home(self, home_data: Dict[str, Any]) -> np.ndarray:
        """Encode home data into embedding."""
        try:
            # Preprocess home data
            processed_data = self.preprocessor.preprocess_home_data(home_data)
            
            # Extract text features and get text embedding
            text_features = self._extract_text_features(processed_data)
            
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
            
            # Extract structured features
            structured_features = self._extract_structured_features(processed_data)
            
            # Combine text and structured embeddings
            combined_embedding = np.concatenate([text_embedding, structured_features])
            
            logger.debug(f"Encoded home {home_data.get('home_id', 'unknown')} into {len(combined_embedding)}-dim embedding")
            return combined_embedding
            
        except Exception as e:
            logger.error(f"Error encoding home data: {e}")
            raise
    
    def encode_homes_batch(self, homes_data: List[Dict[str, Any]]) -> List[np.ndarray]:
        """Encode multiple homes into embeddings."""
        try:
            embeddings = []
            
            # Extract all text features first
            text_features_list = []
            structured_features_list = []
            
            for home_data in homes_data:
                processed_data = self.preprocessor.preprocess_home_data(home_data)
                text_features = self._extract_text_features(processed_data)
                structured_features = self._extract_structured_features(processed_data)
                
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
            
            logger.info(f"Encoded {len(homes_data)} homes into embeddings")
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
