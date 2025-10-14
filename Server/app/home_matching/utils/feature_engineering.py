"""
Feature engineering utilities for tabular features: deltas, overlaps, tolerances.
"""

import numpy as np
from typing import Dict, List, Any, Tuple
import logging

# No tolerance constants needed - homes are already pre-filtered

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Creates engineered features for user-home matching."""
    
    def __init__(self):
        self.feature_names = []
    
    def calculate_price_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate price-related features."""
        features = []
        
        # Get budget range from user preferences
        budget_min_pref = user_prefs.get('home_budget_min') or user_prefs.get('budget_min', 0)
        budget_max_pref = user_prefs.get('home_budget_max') or user_prefs.get('budget_max', 0)
        
        if budget_max_pref and budget_max_pref > 0:
            # Use the range provided by user
            budget_max = float(budget_max_pref)
            if budget_min_pref and budget_min_pref > 0:
                budget_min = float(budget_min_pref)
            else:
                budget_min = budget_max * 0.7  # Default to 70% if min not specified
        else:
            # Default budget fallback if not provided
            budget_min = 500000
            budget_max = 1000000
        
        home_price = home_data.get('price', 0)
        
        # Use median imputation for missing prices (consistent with training)
        if home_price <= 0:
            home_price = 750000  # Median price from training data
        
        # Price within budget (binary)
        within_budget = 1.0 if budget_min <= home_price <= budget_max else 0.0
        features.append(within_budget)
        
        # Price affordability ratio
        affordability_ratio = home_price / budget_max if budget_max > 0 else home_price / 1000000
        features.append(affordability_ratio)
        
        # Price preference score - more nuanced calculation
        if budget_max > budget_min > 0:
            budget_center = (budget_min + budget_max) / 2
            price_distance = abs(home_price - budget_center) / (budget_max - budget_min)
            price_preference_score = max(0.0, 1.0 - price_distance)
        else:
            price_preference_score = home_price / 1000000  # Normalize by typical max
        features.append(price_preference_score)
        
        # Price value score - how much home you get per dollar
        sqft = home_data.get('sqft') or home_data.get('livingArea') or 0
        if sqft and sqft > 0 and home_price > 0:
            price_per_sqft = home_price / sqft
            # Normalize price per sqft (typical range: $100-500 per sqft)
            price_value_score = max(0.0, 1.0 - (price_per_sqft - 100) / 400)
        else:
            price_value_score = 0.5  # Neutral score when data missing
        features.append(price_value_score)
        
        # MISSING FEATURE 1: price_within_tolerance (10% tolerance from training)
        budget_center = (budget_min + budget_max) / 2 if budget_max > budget_min else budget_max
        price_tolerance = budget_max * 0.1  # 10% tolerance from training
        price_within_tolerance = 1.0 if abs(home_price - budget_center) <= price_tolerance else 0.0
        features.append(price_within_tolerance)
        
        return features
    
    def calculate_size_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate size-related features."""
        features = []
        
        # Bedroom features with median imputation
        preferred_bedrooms = user_prefs.get('preferred_bedrooms', 3)
        home_bedrooms = home_data.get('bedrooms', 0)
        
        # Use median imputation (3 bedrooms is median from training)
        if home_bedrooms <= 0:
            home_bedrooms = 3  # Median from training data
        
        bedroom_delta = abs(preferred_bedrooms - home_bedrooms)
        bedroom_score = max(0.0, 1.0 - bedroom_delta / 5.0)
        
        features.extend([bedroom_delta, bedroom_score])
        
        # MISSING FEATURE 2: bedroom_match (exact match from training)
        bedroom_match = 1.0 if home_bedrooms >= preferred_bedrooms else 0.0
        features.append(bedroom_match)
        
        # Bathroom features with median imputation
        preferred_bathrooms = user_prefs.get('preferred_bathrooms', 2)
        home_bathrooms = home_data.get('bathrooms', 0)
        
        # Use median imputation (2 bathrooms is median from training)
        if home_bathrooms <= 0:
            home_bathrooms = 2  # Median from training data
        
        bathroom_delta = abs(preferred_bathrooms - home_bathrooms)
        bathroom_score = max(0.0, 1.0 - bathroom_delta / 3.0)
        
        features.extend([bathroom_delta, bathroom_score])
        
        # MISSING FEATURE 3: bathroom_match (exact match from training)
        bathroom_match = 1.0 if home_bathrooms >= preferred_bathrooms else 0.0
        features.append(bathroom_match)
        
        # Square footage with median imputation
        min_sqft = user_prefs.get('min_sqft', 1500)
        home_sqft = home_data.get('sqft', 0)
        
        # Use median imputation (1800 sqft is median from training)
        if home_sqft <= 0:
            home_sqft = 1800  # Median from training data
        
        sqft_ratio = home_sqft / min_sqft if min_sqft > 0 else home_sqft / 1500
        sqft_adequate = 1.0 if home_sqft >= min_sqft else 0.0
        sqft_score = min(2.0, sqft_ratio)  # Cap at 2.0 like training
        
        features.extend([sqft_ratio, sqft_adequate, sqft_score])
        
        return features
    
    def calculate_location_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate location-related features."""
        features = []
        
        # Commute time features with median imputation
        max_commute = user_prefs.get('max_commute_minutes', 30)
        home_commute = home_data.get('commute_minutes', 0)
        
        # Use median imputation (25 minutes is median from training)
        if home_commute <= 0:
            home_commute = 25  # Median from training data
        
        commute_within_limit = 1.0 if home_commute <= max_commute else 0.0
        commute_score = max(0.0, 1.0 - home_commute / max_commute) if max_commute > 0 else 0.5
        
        features.extend([commute_within_limit, commute_score])
        
        # MISSING FEATURE 4: commute_with_tolerance (5 minute tolerance from training)
        commute_tolerance = 5  # 5 minute tolerance from training
        commute_with_tolerance = 1.0 if home_commute <= (max_commute + commute_tolerance) else 0.0
        features.append(commute_with_tolerance)
        
        # Neighborhood preference match
        preferred_neighborhoods = user_prefs.get('preferred_neighborhoods', [])
        home_neighborhood = home_data.get('neighborhood', '').lower()
        
        if preferred_neighborhoods and home_neighborhood:
            neighborhood_match = 1.0 if any(
                pref.lower() in home_neighborhood for pref in preferred_neighborhoods
            ) else 0.0
        else:
            neighborhood_match = 0.0  # Default to 0 like training
        
        features.append(neighborhood_match)
        
        return features
    
    def calculate_categorical_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate categorical feature matches."""
        features = []
        
        # Home type match
        preferred_types = user_prefs.get('preferred_home_types', ['single_family'])  # Default preference
        home_type = home_data.get('home_type', 'single_family').lower()  # Default type
        
        if preferred_types and home_type:
            type_match = 1.0 if any(
                pref.lower() == home_type for pref in preferred_types
            ) else 0.0
        else:
            type_match = 0.5  # Neutral score instead of 0
        
        features.append(type_match)
        
        # Style preference match
        preferred_styles = user_prefs.get('preferred_styles', ['traditional'])  # Default preference
        home_style = home_data.get('style', 'traditional').lower()  # Default style
        
        if preferred_styles and home_style:
            style_match = 1.0 if any(
                pref.lower() == home_style for pref in preferred_styles
            ) else 0.0
        else:
            style_match = 0.5  # Neutral score instead of 0
        
        features.append(style_match)
        
        return features
    
    def calculate_amenity_features(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> List[float]:
        """Calculate amenity-related features."""
        features = []
        
        # Must-have amenities
        must_have_amenities = user_prefs.get('must_have_amenities', [])
        home_amenities = home_data.get('amenities', ['garage', 'kitchen'])  # Default amenities
        
        if must_have_amenities:
            home_amenities_lower = [a.lower() for a in home_amenities]
            must_have_count = sum(
                1 for amenity in must_have_amenities
                if any(amenity.lower() in ha for ha in home_amenities_lower)
            )
            must_have_ratio = must_have_count / len(must_have_amenities)
        else:
            must_have_ratio = 0.8  # Neutral positive score instead of 1.0
        
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
            nice_to_have_ratio = 0.3  # Small positive score instead of 0.0
        
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
        
        # Combine all features - exactly 22 features
        all_features.extend(price_features)  # 5 features
        all_features.extend(size_features)   # 9 features
        all_features.extend(location_features)  # 4 features
        all_features.extend(categorical_features)  # 2 features
        all_features.extend(amenity_features)  # 2 features
        # Total: 5 + 9 + 4 + 2 + 2 = 22 features
        
        return np.array(all_features)
    
    def get_feature_names(self) -> List[str]:
        """Get names of all features for interpretability."""
        return [
            # Price features (5)
            'price_within_budget', 'price_affordability_ratio', 'price_preference_score', 'price_value_score', 'price_within_tolerance',
            # Size features (9)
            'bedroom_delta', 'bedroom_score', 'bedroom_match',
            'bathroom_delta', 'bathroom_score', 'bathroom_match',
            'sqft_ratio', 'sqft_adequate', 'sqft_score',
            # Location features (4)
            'commute_within_limit', 'commute_score', 'commute_with_tolerance', 'neighborhood_match',
            # Categorical features (2)
            'home_type_match', 'style_match',
            # Amenity features (2)
            'must_have_amenity_ratio', 'nice_to_have_amenity_ratio'
        ]
