"""
Centralized feature configuration for embeddings to ensure dimension consistency.
"""

from collections.abc import Callable
from typing import Any

import numpy as np


class FeatureExtractor:
    """Base class for feature extraction with normalization."""

    def __init__(
        self, name: str, extractor_func: Callable, normalizer: float = 1.0, default_value: Any = 0
    ):
        self.name = name
        self.extractor_func = extractor_func
        self.normalizer = normalizer
        self.default_value = default_value

    def extract(self, data: dict[str, Any]) -> float:
        """Extract and normalize feature from data."""
        try:
            value = self.extractor_func(data)
            if value is None:
                value = self.default_value
            return float(value) / self.normalizer
        except (KeyError, TypeError, ValueError):
            return float(self.default_value) / self.normalizer


# Shared feature extractors for both user and home encoders
SHARED_FEATURES = {
    # Price/Budget features (normalized to millions)
    "price_budget": FeatureExtractor(
        name="price_budget",
        extractor_func=lambda data: data.get(
            "price", data.get("budget_max", data.get("preferences", {}).get("budget_max", 0))
        ),
        normalizer=1000000,
        default_value=0,
    ),
    # Size features
    "bedrooms": FeatureExtractor(
        name="bedrooms",
        extractor_func=lambda data: data.get(
            "bedrooms",
            data.get(
                "preferred_bedrooms", data.get("preferences", {}).get("preferred_bedrooms", 0)
            ),
        ),
        normalizer=10,
        default_value=0,
    ),
    "bathrooms": FeatureExtractor(
        name="bathrooms",
        extractor_func=lambda data: data.get(
            "bathrooms",
            data.get(
                "preferred_bathrooms", data.get("preferences", {}).get("preferred_bathrooms", 0)
            ),
        ),
        normalizer=10,
        default_value=0,
    ),
    "sqft": FeatureExtractor(
        name="sqft",
        extractor_func=lambda data: data.get(
            "sqft", data.get("min_sqft", data.get("preferences", {}).get("min_sqft", 0))
        ),
        normalizer=10000,
        default_value=0,
    ),
    # Commute/Location features
    "commute_time": FeatureExtractor(
        name="commute_time",
        extractor_func=lambda data: data.get(
            "commute_minutes",
            data.get(
                "max_commute_minutes", data.get("preferences", {}).get("max_commute_minutes", 30)
            ),
        ),
        normalizer=120,  # Normalize to 2 hours
        default_value=30,
    ),
    # Binary features
    "pet_friendly": FeatureExtractor(
        name="pet_friendly",
        extractor_func=lambda data: 1.0
        if data.get("pet_friendly", data.get("preferences", {}).get("pet_friendly", False))
        else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
}

# User-specific features (only for user encoder)
USER_SPECIFIC_FEATURES = {
    "budget_min": FeatureExtractor(
        name="budget_min",
        extractor_func=lambda data: data.get("preferences", {}).get("budget_min", 0),
        normalizer=1000000,
        default_value=0,
    ),
    "budget_range": FeatureExtractor(
        name="budget_range",
        extractor_func=lambda data: max(
            0,
            data.get("preferences", {}).get("budget_max", 0)
            - data.get("preferences", {}).get("budget_min", 0),
        ),
        normalizer=1000000,
        default_value=0,
    ),
    "parking_required": FeatureExtractor(
        name="parking_required",
        extractor_func=lambda data: 1.0
        if data.get("preferences", {}).get("parking_required", False)
        else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
    "outdoor_space_required": FeatureExtractor(
        name="outdoor_space_required",
        extractor_func=lambda data: 1.0
        if data.get("preferences", {}).get("outdoor_space_required", False)
        else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
}

# Home-specific features (only for home encoder)
HOME_SPECIFIC_FEATURES = {
    "lot_size": FeatureExtractor(
        name="lot_size",
        extractor_func=lambda data: data.get("lot_size", 0),
        normalizer=50000,  # Normalize to 50k sqft
        default_value=0,
    ),
    "age": FeatureExtractor(
        name="age",
        extractor_func=lambda data: max(0, 2024 - data.get("year_built", 2000)),
        normalizer=100,  # Normalize to century
        default_value=24,  # Default to 24 years old (built in 2000)
    ),
    "walkability_score": FeatureExtractor(
        name="walkability_score",
        extractor_func=lambda data: data.get("walkability_score", 50),
        normalizer=100,
        default_value=50,
    ),
    "transit_score": FeatureExtractor(
        name="transit_score",
        extractor_func=lambda data: data.get("transit_score", 50),
        normalizer=100,
        default_value=50,
    ),
    "bike_score": FeatureExtractor(
        name="bike_score",
        extractor_func=lambda data: data.get("bike_score", 50),
        normalizer=100,
        default_value=50,
    ),
    "has_garage": FeatureExtractor(
        name="has_garage",
        extractor_func=lambda data: 1.0 if data.get("has_garage", False) else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
    "has_yard": FeatureExtractor(
        name="has_yard",
        extractor_func=lambda data: 1.0 if data.get("has_yard", False) else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
    "has_pool": FeatureExtractor(
        name="has_pool",
        extractor_func=lambda data: 1.0 if data.get("has_pool", False) else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
    "recently_renovated": FeatureExtractor(
        name="recently_renovated",
        extractor_func=lambda data: 1.0 if data.get("recently_renovated", False) else 0.0,
        normalizer=1.0,
        default_value=0.0,
    ),
}


class FeatureConfig:
    """Centralized feature configuration manager."""

    @staticmethod
    def get_user_features() -> dict[str, FeatureExtractor]:
        """Get all features for user encoding."""
        features = {}
        features.update(SHARED_FEATURES)
        features.update(USER_SPECIFIC_FEATURES)
        return features

    @staticmethod
    def get_home_features() -> dict[str, FeatureExtractor]:
        """Get all features for home encoding."""
        features = {}
        features.update(SHARED_FEATURES)
        features.update(HOME_SPECIFIC_FEATURES)
        return features

    @staticmethod
    def get_user_structured_dimension() -> int:
        """Get the structured feature dimension for user embeddings."""
        user_features = FeatureConfig.get_user_features()
        home_features = FeatureConfig.get_home_features()
        # Return the union of all features to ensure consistent dimensions
        return len(set(user_features.keys()) | set(home_features.keys()))

    @staticmethod
    def get_home_structured_dimension() -> int:
        """Get the structured feature dimension for home embeddings."""
        user_features = FeatureConfig.get_user_features()
        home_features = FeatureConfig.get_home_features()
        # Return the union of all features to ensure consistent dimensions
        return len(set(user_features.keys()) | set(home_features.keys()))

    @staticmethod
    def extract_user_structured_features(user_data: dict[str, Any]) -> np.ndarray:
        """Extract structured features for user data with padding to match home dimensions."""
        user_features = FeatureConfig.get_user_features()
        home_features = FeatureConfig.get_home_features()

        feature_values = []

        # Extract all features that exist in either user or home features
        all_feature_names = sorted(set(user_features.keys()) | set(home_features.keys()))

        for feature_name in all_feature_names:
            if feature_name in user_features:
                # Extract actual user feature
                feature_extractor = user_features[feature_name]
                value = feature_extractor.extract(user_data)
            else:
                # Pad with zero for features that don't apply to users
                value = 0.0
            feature_values.append(value)

        return np.array(feature_values)

    @staticmethod
    def extract_home_structured_features(home_data: dict[str, Any]) -> np.ndarray:
        """Extract structured features for home data with padding to match user dimensions."""
        user_features = FeatureConfig.get_user_features()
        home_features = FeatureConfig.get_home_features()

        feature_values = []

        # Extract all features that exist in either user or home features
        all_feature_names = sorted(set(user_features.keys()) | set(home_features.keys()))

        for feature_name in all_feature_names:
            if feature_name in home_features:
                # Extract actual home feature
                feature_extractor = home_features[feature_name]
                value = feature_extractor.extract(home_data)
            else:
                # Pad with zero for features that don't apply to homes
                value = 0.0
            feature_values.append(value)

        return np.array(feature_values)

    @staticmethod
    def get_embedding_dimension(
        embedding_provider: str = "sentence_transformer", model: str | None = None
    ) -> dict[str, int]:
        """Get embedding dimensions for both user and home encoders."""
        from .model_loader import model_loader

        try:
            model_info = model_loader.get_model_info(embedding_provider, model)
            text_dim = model_info.get("dimension", 384)
        except Exception:
            text_dim = 384  # Default fallback

        user_structured_dim = FeatureConfig.get_user_structured_dimension()
        home_structured_dim = FeatureConfig.get_home_structured_dimension()

        return {
            "text_dimension": text_dim,
            "user_structured_dimension": user_structured_dim,
            "home_structured_dimension": home_structured_dim,
            "user_total_dimension": text_dim + user_structured_dim,
            "home_total_dimension": text_dim + home_structured_dim,
        }
