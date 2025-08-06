"""
Feature engineering utilities for tabular features: deltas, overlaps, tolerances.
"""

import numpy as np
from typing import Dict, List, Any, Tuple
import logging

from ..config.settings import (
    PRICE_TOLERANCE_PERCENT, COMMUTE_TOLERANCE_MINUTES,
    BEDROOM_TOLERANCE, BATHROOM_TOLERANCE
)

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Creates engineered features for user-home matching."""
    
    def __init__(self):
        self.feature_names = []
    
    def calculate_price_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate price-related features."""
        features = []
        
        budget_min = user_prefs.get('budget_min', 0)
        budget_max = user_prefs.get('budget_max', 0)
        home_price = home_data.get('price', 0)
        
        # Price within budget (binary)
        within_budget = 1.0 if budget_min <= home_price <= budget_max else 0.0
        features.append(within_budget)
        
        # Price affordability ratio (home_price / budget_max)
        affordability_ratio = home_price / budget_max if budget_max > 0 else 0.0
        features.append(affordability_ratio)
        
        # Price preference score (closer to budget center is better)
        if budget_max > budget_min > 0:
            budget_center = (budget_min + budget_max) / 2
            price_distance = abs(home_price - budget_center) / (budget_max - budget_min)
            price_preference_score = max(0.0, 1.0 - price_distance)
        else:
            price_preference_score = 0.0
        features.append(price_preference_score)
        
        # Price tolerance match
        if budget_max > 0:
            tolerance_max = budget_max * (1 + PRICE_TOLERANCE_PERCENT)
            within_tolerance = 1.0 if home_price <= tolerance_max else 0.0
        else:
            within_tolerance = 0.0
        features.append(within_tolerance)
        
        return features
    
    def calculate_size_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate size-related features."""
        features = []
        
        # Bedroom features
        preferred_bedrooms = user_prefs.get('preferred_bedrooms', 0)
        home_bedrooms = home_data.get('bedrooms', 0)
        
        bedroom_delta = abs(preferred_bedrooms - home_bedrooms)
        bedroom_match = 1.0 if bedroom_delta <= BEDROOM_TOLERANCE else 0.0
        bedroom_score = max(0.0, 1.0 - bedroom_delta / 5.0)  # Normalize by max reasonable delta
        
        features.extend([bedroom_delta, bedroom_match, bedroom_score])
        
        # Bathroom features
        preferred_bathrooms = user_prefs.get('preferred_bathrooms', 0)
        home_bathrooms = home_data.get('bathrooms', 0)
        
        bathroom_delta = abs(preferred_bathrooms - home_bathrooms)
        bathroom_match = 1.0 if bathroom_delta <= BATHROOM_TOLERANCE else 0.0
        bathroom_score = max(0.0, 1.0 - bathroom_delta / 3.0)  # Normalize by max reasonable delta
        
        features.extend([bathroom_delta, bathroom_match, bathroom_score])
        
        # Square footage features
        min_sqft = user_prefs.get('min_sqft', 0)
        home_sqft = home_data.get('sqft', 0)
        
        if min_sqft > 0 and home_sqft > 0:
            sqft_ratio = home_sqft / min_sqft
            sqft_adequate = 1.0 if home_sqft >= min_sqft else 0.0
            sqft_score = min(1.0, sqft_ratio)  # Cap at 1.0
        else:
            sqft_ratio = 0.0
            sqft_adequate = 0.0
            sqft_score = 0.0
        
        features.extend([sqft_ratio, sqft_adequate, sqft_score])
        
        return features
    
    def calculate_location_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate location-related features."""
        features = []
        
        # Commute time features (if available)
        max_commute = user_prefs.get('max_commute_minutes', 0)
        home_commute = home_data.get('commute_minutes', 0)
        
        if max_commute > 0 and home_commute > 0:
            commute_within_limit = 1.0 if home_commute <= max_commute else 0.0
            commute_with_tolerance = 1.0 if home_commute <= (max_commute + COMMUTE_TOLERANCE_MINUTES) else 0.0
            commute_score = max(0.0, 1.0 - home_commute / max_commute)
        else:
            commute_within_limit = 0.0
            commute_with_tolerance = 0.0
            commute_score = 0.0
        
        features.extend([commute_within_limit, commute_with_tolerance, commute_score])
        
        # Neighborhood preference match (if available)
        preferred_neighborhoods = user_prefs.get('preferred_neighborhoods', [])
        home_neighborhood = home_data.get('neighborhood', '').lower()
        
        if preferred_neighborhoods and home_neighborhood:
            neighborhood_match = 1.0 if any(
                pref.lower() in home_neighborhood for pref in preferred_neighborhoods
            ) else 0.0
        else:
            neighborhood_match = 0.0
        
        features.append(neighborhood_match)
        
        return features
    
    def calculate_categorical_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate categorical feature matches."""
        features = []
        
        # Home type match
        preferred_types = user_prefs.get('preferred_home_types', [])
        home_type = home_data.get('home_type', '').lower()
        
        if preferred_types and home_type:
            type_match = 1.0 if any(
                pref.lower() == home_type for pref in preferred_types
            ) else 0.0
        else:
            type_match = 0.0
        
        features.append(type_match)
        
        # Style preference match
        preferred_styles = user_prefs.get('preferred_styles', [])
        home_style = home_data.get('style', '').lower()
        
        if preferred_styles and home_style:
            style_match = 1.0 if any(
                pref.lower() == home_style for pref in preferred_styles
            ) else 0.0
        else:
            style_match = 0.0
        
        features.append(style_match)
        
        return features
    
    def calculate_amenity_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate amenity-related features."""
        features = []
        
        # Must-have amenities
        must_have_amenities = user_prefs.get('must_have_amenities', [])
        home_amenities = home_data.get('amenities', [])
        
        if must_have_amenities:
            home_amenities_lower = [a.lower() for a in home_amenities]
            must_have_count = sum(
                1 for amenity in must_have_amenities
                if any(amenity.lower() in ha for ha in home_amenities_lower)
            )
            must_have_ratio = must_have_count / len(must_have_amenities)
        else:
            must_have_ratio = 1.0  # No requirements = perfect match
        
        features.append(must_have_ratio)
        
        # Nice-to-have amenities
        nice_to_have_amenities = user_prefs.get('nice_to_have_amenities', [])
        
        if nice_to_have_amenities:
            home_amenities_lower = [a.lower() for a in home_amenities]
            nice_to_have_count = sum(
                1 for amenity in nice_to_have_amenities
                if any(amenity.lower() in ha for ha in home_amenities_lower)
            )
            nice_to_have_ratio = nice_to_have_count / len(nice_to_have_amenities)
        else:
            nice_to_have_ratio = 0.0
        
        features.append(nice_to_have_ratio)
        
        return features
    
    def create_all_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> np.ndarray:
        """Create all engineered features for a user-home pair."""
        all_features = []
        
        # Calculate different feature groups
        price_features = self.calculate_price_features(user_prefs, home_data)
        size_features = self.calculate_size_features(user_prefs, home_data)
        location_features = self.calculate_location_features(user_prefs, home_data)
        categorical_features = self.calculate_categorical_features(user_prefs, home_data)
        amenity_features = self.calculate_amenity_features(user_prefs, home_data)
        
        # Combine all features
        all_features.extend(price_features)
        all_features.extend(size_features)
        all_features.extend(location_features)
        all_features.extend(categorical_features)
        all_features.extend(amenity_features)
        
        return np.array(all_features)
    
    def get_feature_names(self) -> List[str]:
        """Get names of all features for interpretability."""
        return [
            # Price features
            'price_within_budget', 'price_affordability_ratio', 'price_preference_score', 'price_within_tolerance',
            # Size features
            'bedroom_delta', 'bedroom_match', 'bedroom_score',
            'bathroom_delta', 'bathroom_match', 'bathroom_score',
            'sqft_ratio', 'sqft_adequate', 'sqft_score',
            # Location features
            'commute_within_limit', 'commute_with_tolerance', 'commute_score', 'neighborhood_match',
            # Categorical features
            'home_type_match', 'style_match',
            # Amenity features
            'must_have_amenity_ratio', 'nice_to_have_amenity_ratio'
        ]
