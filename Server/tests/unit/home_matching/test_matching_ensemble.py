"""
Unit tests for ensemble scoring, matching system, and error handling (home matching).
"""

import unittest
from unittest.mock import Mock, patch

import numpy as np

from app.services.search.home_matching.config.match import find_best_matches
from app.services.search.home_matching.postprocessing.blend_scores import EnsembleScorer
from app.services.search.home_matching.utils.feature_engineering import FeatureEngineer
from app.services.search.home_matching.utils.preprocessing import DataPreprocessor


def create_sample_user():
    """Minimal user dict for tests."""
    return {
        "user_id": "test-user-1",
        "preferences": {"budget_min": 200000, "budget_max": 500000},
    }


def create_sample_home():
    """Minimal home dict for tests."""
    return {
        "home_id": "test-home-1",
        "price": 350000,
        "bedrooms": 3,
        "bathrooms": 2,
    }


class TestEnsembleScorer(unittest.TestCase):
    """Test ensemble scoring functionality."""

    def setUp(self):
        with patch("app.services.search.home_matching.postprocessing.blend_scores.EmbeddingScorer"):
            self.ensemble = EnsembleScorer()

    def test_blend_scores(self):
        """Test score blending functionality (single embedding score, scaled to 0-100)."""
        final_score = self.ensemble.blend_scores(0.8)
        self.assertAlmostEqual(final_score, 80.0, places=5)

        final_score = self.ensemble.blend_scores(0.0)
        self.assertEqual(final_score, 0.0)

        final_score = self.ensemble.blend_scores(1.0)
        self.assertEqual(final_score, 100.0)

        # Clamping: values outside [0, 1] are clamped
        final_score = self.ensemble.blend_scores(1.5)
        self.assertLessEqual(final_score, 100.0)
        final_score = self.ensemble.blend_scores(-0.5)
        self.assertGreaterEqual(final_score, 0.0)

    def test_ensemble_stores_provider_and_model(self):
        """Test that ensemble stores embedding provider and model."""
        with patch("app.services.search.home_matching.postprocessing.blend_scores.EmbeddingScorer"):
            ensemble = EnsembleScorer(
                embedding_provider="sentence_transformer",
                embedding_model="all-MiniLM-L6-v2",
                user_id="test-user",
            )
        self.assertEqual(ensemble.embedding_provider, "sentence_transformer")
        self.assertEqual(ensemble.embedding_model, "all-MiniLM-L6-v2")
        self.assertEqual(ensemble.user_id, "test-user")


class TestMatchingSystem(unittest.TestCase):
    """Test the complete matching system."""

    def setUp(self):
        self.user = create_sample_user()
        self.home = create_sample_home()

    def test_create_sample_data(self):
        """Test sample data creation."""
        self.assertIn("user_id", self.user)
        self.assertIn("preferences", self.user)
        self.assertIn("budget_min", self.user["preferences"])
        self.assertIn("budget_max", self.user["preferences"])
        self.assertIn("home_id", self.home)
        self.assertIn("price", self.home)
        self.assertIn("bedrooms", self.home)
        self.assertIn("bathrooms", self.home)

    @patch("app.services.search.home_matching.config.match.EnsembleScorer")
    def test_find_best_matches(self, mock_ensemble_class):
        """Test find_best_matches function."""
        mock_ensemble = Mock()
        mock_ensemble.rank_homes_for_user.return_value = [
            {
                "home_data": self.home,
                "home_id": self.home["home_id"],
                "final_score": 0.85,
                "rank": 1,
            }
        ]
        mock_ensemble_class.return_value = mock_ensemble

        matches = find_best_matches(self.user, [self.home], top_k=1)
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["final_score"], 0.85)
        self.assertEqual(matches[0]["rank"], 1)
        mock_ensemble.rank_homes_for_user.assert_called_once()


class TestErrorHandling(unittest.TestCase):
    """Test error handling throughout the system."""

    def test_preprocessing_error_handling(self):
        """Test that preprocessing handles invalid data gracefully."""
        preprocessor = DataPreprocessor()
        processed = preprocessor.preprocess_user_data({"invalid": "data"})
        self.assertIsInstance(processed, dict)
        processed = preprocessor.preprocess_home_data({"invalid": "data"})
        self.assertIsInstance(processed, dict)

    def test_feature_engineering_error_handling(self):
        """Test that feature engineering handles missing data."""
        feature_engineer = FeatureEngineer()
        features = feature_engineer.create_all_features({}, {})
        self.assertIsInstance(features, np.ndarray)
        self.assertGreater(len(features), 0)

    @patch("app.services.search.home_matching.postprocessing.blend_scores.EmbeddingScorer")
    def test_ensemble_error_handling(self, mock_embedding):
        """Test that ensemble handles scorer failures gracefully."""
        mock_embedding_instance = Mock()
        mock_embedding_instance.get_user_home_similarity.side_effect = Exception("Embedding failed")
        mock_embedding.return_value = mock_embedding_instance

        ensemble = EnsembleScorer()
        user = create_sample_user()
        home = create_sample_home()
        result = ensemble.score_user_home_pair(user, home)

        self.assertIn("final_score", result)
        self.assertIn("errors", result)
        self.assertIn("embedding", result["errors"])
        self.assertEqual(result["final_score"], 0.0)
