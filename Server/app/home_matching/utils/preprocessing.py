"""
Data preprocessing utilities for user and home data.
"""

import re
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

from ..config.settings import MAX_TEXT_LENGTH, STOPWORDS_REMOVE

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Handles preprocessing of user and home data."""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.fitted = False
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data."""
        if not isinstance(text, str):
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,!?-]', '', text)
        
        # Truncate if too long
        if len(text) > MAX_TEXT_LENGTH:
            text = text[:MAX_TEXT_LENGTH]
        
        return text
    
    def normalize_price(self, price: Union[str, int, float]) -> float:
        """Normalize price data."""
        if isinstance(price, str):
            # Remove currency symbols and commas
            price = re.sub(r'[^\d.]', '', price)
            try:
                price = float(price)
            except ValueError:
                return 0.0
        
        return float(price) if price is not None else 0.0
    
    def normalize_bedrooms(self, bedrooms: Union[str, int, float]) -> float:
        """Normalize bedroom count."""
        if isinstance(bedrooms, str):
            # Handle cases like "2-3 bedrooms" or "2+"
            bedrooms = re.sub(r'[^\d.]', '', bedrooms.split('-')[0].split('+')[0])
            try:
                bedrooms = float(bedrooms)
            except ValueError:
                return 0.0
        
        return float(bedrooms) if bedrooms is not None else 0.0
    
    def normalize_bathrooms(self, bathrooms: Union[str, int, float]) -> float:
        """Normalize bathroom count."""
        if isinstance(bathrooms, str):
            # Handle cases like "1.5 baths" or "2+"
            bathrooms = re.sub(r'[^\d.]', '', bathrooms.split('+')[0])
            try:
                bathrooms = float(bathrooms)
            except ValueError:
                return 0.0
        
        return float(bathrooms) if bathrooms is not None else 0.0
    
    def normalize_sqft(self, sqft: Union[str, int, float]) -> float:
        """Normalize square footage."""
        if isinstance(sqft, str):
            sqft = re.sub(r'[^\d.]', '', sqft)
            try:
                sqft = float(sqft)
            except ValueError:
                return 0.0
        
        return float(sqft) if sqft is not None else 0.0
    
    def preprocess_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preprocess user preference data."""
        processed = user_data.copy()
        preferences = processed.get('preferences', {})
        
        # Normalize numerical preferences
        if 'budget_min' in preferences:
            preferences['budget_min'] = self.normalize_price(preferences['budget_min'])
        if 'budget_max' in preferences:
            preferences['budget_max'] = self.normalize_price(preferences['budget_max'])
        if 'preferred_bedrooms' in preferences:
            preferences['preferred_bedrooms'] = self.normalize_bedrooms(preferences['preferred_bedrooms'])
        if 'preferred_bathrooms' in preferences:
            preferences['preferred_bathrooms'] = self.normalize_bathrooms(preferences['preferred_bathrooms'])
        if 'min_sqft' in preferences:
            preferences['min_sqft'] = self.normalize_sqft(preferences['min_sqft'])
        
        # Clean text fields
        text_fields = ['lifestyle', 'work_style', 'hobbies', 'family_status', 'notes']
        for field in text_fields:
            if field in preferences:
                preferences[field] = self.clean_text(str(preferences[field]))
        
        # Normalize categorical fields
        categorical_fields = ['housing_type', 'location_preference', 'commute_preference']
        for field in categorical_fields:
            if field in preferences and isinstance(preferences[field], str):
                preferences[field] = preferences[field].lower().strip()
        
        processed['preferences'] = preferences
        return processed
    
    def preprocess_home_data(self, home_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preprocess home listing data."""
        processed = home_data.copy()
        
        # Normalize numerical fields
        processed['price'] = self.normalize_price(processed.get('price', 0))
        processed['bedrooms'] = self.normalize_bedrooms(processed.get('bedrooms', 0))
        processed['bathrooms'] = self.normalize_bathrooms(processed.get('bathrooms', 0))
        processed['sqft'] = self.normalize_sqft(processed.get('sqft', 0))
        
        # Clean text fields
        text_fields = ['description', 'neighborhood_info', 'amenities']
        for field in text_fields:
            if field in processed:
                processed[field] = self.clean_text(str(processed[field]))
        
        # Normalize categorical fields
        categorical_fields = ['home_type', 'style', 'condition']
        for field in categorical_fields:
            if field in processed and isinstance(processed[field], str):
                processed[field] = processed[field].lower().strip()
        
        # Parse address components
        if 'address' in processed:
            processed['address_clean'] = self.clean_text(str(processed['address']))
        
        return processed
    
    def create_feature_vector(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> np.ndarray:
        """Create feature vector for tabular model."""
        features = []
        
        # User features
        preferences = user_data.get('preferences', {})
        features.extend([
            preferences.get('budget_min', 0),
            preferences.get('budget_max', 0),
            preferences.get('preferred_bedrooms', 0),
            preferences.get('preferred_bathrooms', 0),
            preferences.get('min_sqft', 0),
        ])
        
        # Home features
        features.extend([
            home_data.get('price', 0),
            home_data.get('bedrooms', 0),
            home_data.get('bathrooms', 0),
            home_data.get('sqft', 0),
        ])
        
        # Computed features (deltas, ratios, etc.)
        budget_max = preferences.get('budget_max', 0)
        home_price = home_data.get('price', 0)
        
        # Price affordability ratio
        price_ratio = home_price / budget_max if budget_max > 0 else 0
        features.append(price_ratio)
        
        # Bedroom delta
        bedroom_delta = abs(preferences.get('preferred_bedrooms', 0) - home_data.get('bedrooms', 0))
        features.append(bedroom_delta)
        
        # Bathroom delta
        bathroom_delta = abs(preferences.get('preferred_bathrooms', 0) - home_data.get('bathrooms', 0))
        features.append(bathroom_delta)
        
        # Square footage ratio
        min_sqft = preferences.get('min_sqft', 0)
        home_sqft = home_data.get('sqft', 0)
        sqft_ratio = home_sqft / min_sqft if min_sqft > 0 else 1
        features.append(sqft_ratio)
        
        return np.array(features)
    
    def fit_scalers(self, feature_vectors: List[np.ndarray]) -> None:
        """Fit scalers on training data."""
        if not feature_vectors:
            return
        
        X = np.vstack(feature_vectors)
        self.scaler = StandardScaler()
        self.scaler.fit(X)
        self.fitted = True
    
    def transform_features(self, feature_vector: np.ndarray) -> np.ndarray:
        """Transform features using fitted scalers."""
        if not self.fitted:
            logger.warning("Scalers not fitted, returning original features")
            return feature_vector
        
        return self.scaler.transform(feature_vector.reshape(1, -1))[0]
