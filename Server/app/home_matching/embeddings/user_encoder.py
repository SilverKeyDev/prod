"""
User encoder that combines structured and text data into user embeddings.
"""

import numpy as np
from typing import Dict, List, Any, Optional
import logging

from .model_loader import model_loader
from ..utils.preprocessing import DataPreprocessor

logger = logging.getLogger(__name__)

class UserEncoder:
    """Encodes user preferences into embeddings."""
    
    def __init__(self, embedding_provider: str = "sentence_transformer", model: str = None):
        self.embedding_provider = embedding_provider
        self.model = model
        self.preprocessor = DataPreprocessor()
    
    def _extract_text_features(self, user_data: Dict[str, Any]) -> str:
        """Extract and combine text features from user data."""
        preferences = user_data.get('preferences', {})
        
        text_parts = []
        
        # Lifestyle and personal info
        if 'lifestyle' in preferences:
            text_parts.append(f"Lifestyle: {preferences['lifestyle']}")
        
        if 'work_style' in preferences:
            text_parts.append(f"Work style: {preferences['work_style']}")
        
        if 'hobbies' in preferences:
            text_parts.append(f"Hobbies: {preferences['hobbies']}")
        
        if 'family_status' in preferences:
            text_parts.append(f"Family: {preferences['family_status']}")
        
        # Housing preferences
        if 'preferred_home_types' in preferences:
            types = ', '.join(preferences['preferred_home_types'])
            text_parts.append(f"Preferred home types: {types}")
        
        if 'preferred_neighborhoods' in preferences:
            neighborhoods = ', '.join(preferences['preferred_neighborhoods'])
            text_parts.append(f"Preferred neighborhoods: {neighborhoods}")
        
        if 'must_have_amenities' in preferences:
            amenities = ', '.join(preferences['must_have_amenities'])
            text_parts.append(f"Must have amenities: {amenities}")
        
        if 'nice_to_have_amenities' in preferences:
            amenities = ', '.join(preferences['nice_to_have_amenities'])
            text_parts.append(f"Nice to have amenities: {amenities}")
        
        # Location preferences
        if 'location_preference' in preferences:
            text_parts.append(f"Location preference: {preferences['location_preference']}")
        
        if 'commute_preference' in preferences:
            text_parts.append(f"Commute preference: {preferences['commute_preference']}")
        
        # Additional notes
        if 'notes' in preferences:
            text_parts.append(f"Additional notes: {preferences['notes']}")
        
        return ' '.join(text_parts)
    
    def _extract_structured_features(self, user_data: Dict[str, Any]) -> np.ndarray:
        """Extract structured numerical features from user data."""
        preferences = user_data.get('preferences', {})
        
        features = []
        
        # Budget features (normalized)
        budget_min = preferences.get('budget_min', 0)
        budget_max = preferences.get('budget_max', 0)
        budget_range = budget_max - budget_min if budget_max > budget_min else 0
        
        features.extend([
            budget_min / 1000000,  # Normalize to millions
            budget_max / 1000000,
            budget_range / 1000000
        ])
        
        # Size preferences
        features.extend([
            preferences.get('preferred_bedrooms', 0) / 10,  # Normalize
            preferences.get('preferred_bathrooms', 0) / 10,
            preferences.get('min_sqft', 0) / 10000  # Normalize to 10k sqft
        ])
        
        # Commute preference (if numeric)
        max_commute = preferences.get('max_commute_minutes', 0)
        features.append(max_commute / 120)  # Normalize to 2 hours
        
        # Binary preferences
        features.append(1.0 if preferences.get('pet_friendly', False) else 0.0)
        features.append(1.0 if preferences.get('parking_required', False) else 0.0)
        features.append(1.0 if preferences.get('outdoor_space_required', False) else 0.0)
        
        return np.array(features)
    
    def encode_user(self, user_data: Dict[str, Any]) -> np.ndarray:
        """Encode user data into embedding."""
        try:
            # Preprocess user data
            processed_data = self.preprocessor.preprocess_user_data(user_data)
            
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
            # Method 1: Concatenate (simple approach)
            combined_embedding = np.concatenate([text_embedding, structured_features])
            
            # Method 2: Weighted combination (alternative)
            # text_weight = 0.8
            # struct_weight = 0.2
            # if len(structured_features) > 0:
            #     # Pad or truncate structured features to match text embedding dimension
            #     if len(structured_features) < len(text_embedding):
            #         structured_padded = np.pad(structured_features, 
            #                                   (0, len(text_embedding) - len(structured_features)))
            #     else:
            #         structured_padded = structured_features[:len(text_embedding)]
            #     
            #     combined_embedding = (text_weight * text_embedding + 
            #                          struct_weight * structured_padded)
            # else:
            #     combined_embedding = text_embedding
            
            logger.debug(f"Encoded user {user_data.get('user_id', 'unknown')} into {len(combined_embedding)}-dim embedding")
            return combined_embedding
            
        except Exception as e:
            logger.error(f"Error encoding user data: {e}")
            raise
    
    def encode_users_batch(self, users_data: List[Dict[str, Any]]) -> List[np.ndarray]:
        """Encode multiple users into embeddings."""
        try:
            embeddings = []
            
            # Extract all text features first
            text_features_list = []
            structured_features_list = []
            
            for user_data in users_data:
                processed_data = self.preprocessor.preprocess_user_data(user_data)
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
            
            logger.info(f"Encoded {len(users_data)} users into embeddings")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error encoding users batch: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the combined embedding."""
        try:
            model_info = model_loader.get_model_info(self.embedding_provider, self.model)
            text_dim = model_info.get('dimension', 384)
            
            # Add structured features dimension (from _extract_structured_features)
            structured_dim = 10  # Based on the features we extract
            
            return text_dim + structured_dim
        except Exception as e:
            logger.error(f"Error getting embedding dimension: {e}")
            return 384 + 10  # Default fallback
