"""
Unit tests for preprocessing, feature engineering, and similarity (home matching).
"""

import unittest

import numpy as np

from app.services.search.home_matching.utils.feature_engineering import FeatureEngineer
from app.services.search.home_matching.utils.preprocessing import DataPreprocessor
from app.services.search.home_matching.utils.similarity import (
    SimilarityCalculator,
    cosine_similarity_score,
)


class TestDataPreprocessing(unittest.TestCase):
    """Test data preprocessing functionality."""

    def setUp(self):
        self.preprocessor = DataPreprocessor()

    def test_clean_text(self):
        """Test text cleaning functionality."""
        text = "This is a normal text with spaces."
        cleaned = self.preprocessor.clean_text(text)
        self.assertEqual(cleaned, "This is a normal text with spaces.")

        text = "  Multiple   spaces   everywhere  "
        cleaned = self.preprocessor.clean_text(text)
        self.assertEqual(cleaned, "Multiple spaces everywhere")

        cleaned = self.preprocessor.clean_text("")
        self.assertEqual(cleaned, "")

        cleaned = self.preprocessor.clean_text(None)
        self.assertEqual(cleaned, "")

    def test_normalize_price(self):
        """Test price normalization."""
        self.assertEqual(self.preprocessor.normalize_price(500000), 500000.0)
        self.assertEqual(self.preprocessor.normalize_price("$500,000"), 500000.0)
        self.assertEqual(self.preprocessor.normalize_price("invalid"), 0.0)
        self.assertEqual(self.preprocessor.normalize_price(None), 0.0)

    def test_preprocess_user_data(self):
        """Test user data preprocessing."""
        user_data = {
            "user_id": "test_user",
            "preferences": {
                "budget_min": "$400,000",
                "budget_max": "800000",
                "preferred_bedrooms_min": "3",
                "lifestyle": "  Active professional  ",
                "housing_type": "HOUSE",
            },
        }
        processed = self.preprocessor.preprocess_user_data(user_data)
        self.assertEqual(processed["preferences"]["budget_min"], 400000.0)
        self.assertEqual(processed["preferences"]["budget_max"], 800000.0)
        self.assertEqual(processed["preferences"]["preferred_bedrooms_min"], 3.0)
        self.assertEqual(processed["preferences"]["lifestyle"], "Active professional")
        self.assertEqual(processed["preferences"]["housing_type"], "house")

    def test_preprocess_home_data(self):
        """Test home data preprocessing."""
        home_data = {
            "home_id": "test_home",
            "price": "$650,000",
            "bedrooms": "3",
            "bathrooms": "2.5",
            "description": "  Beautiful home with  extra   spaces  ",
            "home_type": "HOUSE",
        }
        processed = self.preprocessor.preprocess_home_data(home_data)
        self.assertEqual(processed["price"], 650000.0)
        self.assertEqual(processed["bedrooms"], 3.0)
        self.assertEqual(processed["bathrooms"], 2.5)
        self.assertEqual(processed["description"], "Beautiful home with extra spaces")
        self.assertEqual(processed["home_type"], "house")


class TestFeatureEngineering(unittest.TestCase):
    """Test feature engineering functionality."""

    def setUp(self):
        self.feature_engineer = FeatureEngineer()

    def test_calculate_price_features(self):
        """Test price feature calculation."""
        user_prefs = {"budget_min": 400000, "budget_max": 800000}
        home_data = {"price": 600000}
        features = self.feature_engineer.calculate_price_features(user_prefs, home_data)
        self.assertEqual(len(features), 5)
        self.assertEqual(features[0], 1.0)
        self.assertEqual(features[1], 0.75)

    def test_calculate_size_features(self):
        """Test size feature calculation."""
        user_prefs = {
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms_min": 2.5,
            "min_sqft": 1800,
        }
        home_data = {"bedrooms": 3, "bathrooms": 2.5, "sqft": 2000}
        features = self.feature_engineer.calculate_size_features(user_prefs, home_data)
        self.assertEqual(len(features), 9)
        self.assertEqual(features[0], 0.0)
        self.assertEqual(features[1], 1.0)
        self.assertEqual(features[3], 0.0)
        self.assertEqual(features[4], 1.0)

    def test_create_all_features(self):
        """Test complete feature creation."""
        user_prefs = {
            "budget_min": 400000,
            "budget_max": 800000,
            "preferred_bedrooms_min": 3,
            "preferred_bathrooms_min": 2.5,
        }
        home_data = {
            "price": 600000,
            "bedrooms": 3,
            "bathrooms": 2.5,
            "sqft": 2000,
        }
        features = self.feature_engineer.create_all_features(user_prefs, home_data)
        self.assertIsInstance(features, np.ndarray)
        self.assertGreater(len(features), 10)


class TestSimilarityCalculator(unittest.TestCase):
    """Test similarity calculation functionality."""

    def setUp(self):
        self.similarity_calc = SimilarityCalculator()

    def test_cosine_similarity_score(self):
        """Test cosine similarity calculation."""
        vec1 = np.array([1, 0, 0])
        vec2 = np.array([1, 0, 0])
        similarity = cosine_similarity_score(vec1, vec2)
        self.assertAlmostEqual(similarity, 1.0, places=5)

        vec1 = np.array([1, 0])
        vec2 = np.array([0, 1])
        similarity = cosine_similarity_score(vec1, vec2)
        self.assertAlmostEqual(similarity, 0.0, places=5)

    def test_similarity_calculator(self):
        """Test SimilarityCalculator class."""
        vec1 = np.array([1, 2, 3])
        vec2 = np.array([4, 5, 6])
        similarity = self.similarity_calc.calculate(vec1, vec2, "cosine")
        self.assertIsInstance(similarity, float)
        self.assertGreaterEqual(similarity, -1.0)
        self.assertLessEqual(similarity, 1.0)
        similarity = self.similarity_calc.calculate(vec1, vec2, "dot_product")
        self.assertIsInstance(similarity, float)
