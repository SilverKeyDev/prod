"""
Unit tests for the home matching system.
"""

import unittest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from home_matching.app.match import (
    find_best_matches, score_single_match, create_sample_user, create_sample_home
)
from home_matching.ensemble.blend_scores import EnsembleScorer
from home_matching.utils.preprocessing import DataPreprocessor
from home_matching.utils.feature_engineering import FeatureEngineer
from home_matching.utils.similarity import SimilarityCalculator
from home_matching.embeddings.scorer import EmbeddingScorer
from home_matching.tabular_model.predict import TabularPredictor
from home_matching.llm_scorer.scorer import LLMScorer

class TestDataPreprocessing(unittest.TestCase):
    """Test data preprocessing functionality."""
    
    def setUp(self):
        self.preprocessor = DataPreprocessor()
    
    def test_clean_text(self):
        """Test text cleaning functionality."""
        # Test normal text
        text = "This is a normal text with spaces."
        cleaned = self.preprocessor.clean_text(text)
        self.assertEqual(cleaned, "This is a normal text with spaces.")
        
        # Test text with extra whitespace
        text = "  Multiple   spaces   everywhere  "
        cleaned = self.preprocessor.clean_text(text)
        self.assertEqual(cleaned, "Multiple spaces everywhere")
        
        # Test empty string
        cleaned = self.preprocessor.clean_text("")
        self.assertEqual(cleaned, "")
        
        # Test non-string input
        cleaned = self.preprocessor.clean_text(None)
        self.assertEqual(cleaned, "")
    
    def test_normalize_price(self):
        """Test price normalization."""
        # Test integer
        self.assertEqual(self.preprocessor.normalize_price(500000), 500000.0)
        
        # Test string with currency symbols
        self.assertEqual(self.preprocessor.normalize_price("$500,000"), 500000.0)
        
        # Test invalid string
        self.assertEqual(self.preprocessor.normalize_price("invalid"), 0.0)
        
        # Test None
        self.assertEqual(self.preprocessor.normalize_price(None), 0.0)
    
    def test_preprocess_user_data(self):
        """Test user data preprocessing."""
        user_data = {
            'user_id': 'test_user',
            'preferences': {
                'budget_min': '$400,000',
                'budget_max': '800000',
                'preferred_bedrooms': '3',
                'lifestyle': '  Active professional  ',
                'housing_type': 'HOUSE'
            }
        }
        
        processed = self.preprocessor.preprocess_user_data(user_data)
        
        self.assertEqual(processed['preferences']['budget_min'], 400000.0)
        self.assertEqual(processed['preferences']['budget_max'], 800000.0)
        self.assertEqual(processed['preferences']['preferred_bedrooms'], 3.0)
        self.assertEqual(processed['preferences']['lifestyle'], 'Active professional')
        self.assertEqual(processed['preferences']['housing_type'], 'house')
    
    def test_preprocess_home_data(self):
        """Test home data preprocessing."""
        home_data = {
            'home_id': 'test_home',
            'price': '$650,000',
            'bedrooms': '3',
            'bathrooms': '2.5',
            'description': '  Beautiful home with  extra   spaces  ',
            'home_type': 'HOUSE'
        }
        
        processed = self.preprocessor.preprocess_home_data(home_data)
        
        self.assertEqual(processed['price'], 650000.0)
        self.assertEqual(processed['bedrooms'], 3.0)
        self.assertEqual(processed['bathrooms'], 2.5)
        self.assertEqual(processed['description'], 'Beautiful home with extra spaces')
        self.assertEqual(processed['home_type'], 'house')

class TestFeatureEngineering(unittest.TestCase):
    """Test feature engineering functionality."""
    
    def setUp(self):
        self.feature_engineer = FeatureEngineer()
    
    def test_calculate_price_features(self):
        """Test price feature calculation."""
        user_prefs = {
            'budget_min': 400000,
            'budget_max': 800000
        }
        home_data = {
            'price': 600000
        }
        
        features = self.feature_engineer.calculate_price_features(user_prefs, home_data)
        
        # Should have 4 price features
        self.assertEqual(len(features), 4)
        
        # Price within budget should be 1.0
        self.assertEqual(features[0], 1.0)  # within_budget
        
        # Affordability ratio should be 0.75 (600k / 800k)
        self.assertEqual(features[1], 0.75)  # affordability_ratio
    
    def test_calculate_size_features(self):
        """Test size feature calculation."""
        user_prefs = {
            'preferred_bedrooms': 3,
            'preferred_bathrooms': 2.5,
            'min_sqft': 1800
        }
        home_data = {
            'bedrooms': 3,
            'bathrooms': 2.5,
            'sqft': 2000
        }
        
        features = self.feature_engineer.calculate_size_features(user_prefs, home_data)
        
        # Should have 9 size features
        self.assertEqual(len(features), 9)
        
        # Perfect matches should have delta = 0 and match = 1.0
        self.assertEqual(features[0], 0.0)  # bedroom_delta
        self.assertEqual(features[1], 1.0)  # bedroom_match
        self.assertEqual(features[3], 0.0)  # bathroom_delta
        self.assertEqual(features[4], 1.0)  # bathroom_match
    
    def test_create_all_features(self):
        """Test complete feature creation."""
        user_prefs = {
            'budget_min': 400000,
            'budget_max': 800000,
            'preferred_bedrooms': 3,
            'preferred_bathrooms': 2.5
        }
        home_data = {
            'price': 600000,
            'bedrooms': 3,
            'bathrooms': 2.5,
            'sqft': 2000
        }
        
        features = self.feature_engineer.create_all_features(user_prefs, home_data)
        
        # Should return numpy array
        self.assertIsInstance(features, np.ndarray)
        
        # Should have multiple features
        self.assertGreater(len(features), 10)

class TestSimilarityCalculator(unittest.TestCase):
    """Test similarity calculation functionality."""
    
    def setUp(self):
        self.similarity_calc = SimilarityCalculator()
    
    def test_cosine_similarity_score(self):
        """Test cosine similarity calculation."""
        from home_matching.utils.similarity import cosine_similarity_score
        
        # Test identical vectors
        vec1 = np.array([1, 0, 0])
        vec2 = np.array([1, 0, 0])
        similarity = cosine_similarity_score(vec1, vec2)
        self.assertAlmostEqual(similarity, 1.0, places=5)
        
        # Test orthogonal vectors
        vec1 = np.array([1, 0])
        vec2 = np.array([0, 1])
        similarity = cosine_similarity_score(vec1, vec2)
        self.assertAlmostEqual(similarity, 0.0, places=5)
    
    def test_similarity_calculator(self):
        """Test SimilarityCalculator class."""
        vec1 = np.array([1, 2, 3])
        vec2 = np.array([4, 5, 6])
        
        # Test cosine similarity
        similarity = self.similarity_calc.calculate(vec1, vec2, "cosine")
        self.assertIsInstance(similarity, float)
        self.assertGreaterEqual(similarity, -1.0)
        self.assertLessEqual(similarity, 1.0)
        
        # Test dot product
        similarity = self.similarity_calc.calculate(vec1, vec2, "dot_product")
        self.assertIsInstance(similarity, float)

class TestEnsembleScorer(unittest.TestCase):
    """Test ensemble scoring functionality."""
    
    def setUp(self):
        # Mock the individual scorers to avoid external dependencies
        with patch('home_matching.ensemble.blend_scores.EmbeddingScorer'), \
             patch('home_matching.ensemble.blend_scores.TabularPredictor'), \
             patch('home_matching.ensemble.blend_scores.LLMScorer'):
            self.ensemble = EnsembleScorer()
    
    def test_blend_scores(self):
        """Test score blending functionality."""
        # Test normal scores
        final_score = self.ensemble.blend_scores(0.8, 0.6, 0.4)
        
        # Should be weighted average
        expected = 0.4 * 0.8 + 0.4 * 0.6 + 0.2 * 0.4
        self.assertAlmostEqual(final_score, expected, places=5)
        
        # Test edge cases
        final_score = self.ensemble.blend_scores(0.0, 0.0, 0.0)
        self.assertEqual(final_score, 0.0)
        
        final_score = self.ensemble.blend_scores(1.0, 1.0, 1.0)
        self.assertEqual(final_score, 1.0)
        
        # Test out-of-range scores (should be clamped)
        final_score = self.ensemble.blend_scores(1.5, -0.5, 0.5)
        self.assertGreaterEqual(final_score, 0.0)
        self.assertLessEqual(final_score, 1.0)
    
    def test_weight_normalization(self):
        """Test that weights are normalized to sum to 1."""
        # Create ensemble with non-normalized weights
        with patch('home_matching.ensemble.blend_scores.EmbeddingScorer'), \
             patch('home_matching.ensemble.blend_scores.TabularPredictor'), \
             patch('home_matching.ensemble.blend_scores.LLMScorer'):
            ensemble = EnsembleScorer(
                embedding_weight=2.0,
                tabular_weight=2.0,
                llm_weight=1.0
            )
        
        # Weights should sum to 1
        total_weight = (ensemble.embedding_weight + 
                       ensemble.tabular_weight + 
                       ensemble.llm_weight)
        self.assertAlmostEqual(total_weight, 1.0, places=5)

class TestMatchingSystem(unittest.TestCase):
    """Test the complete matching system."""
    
    def setUp(self):
        self.user = create_sample_user()
        self.home = create_sample_home()
    
    def test_create_sample_data(self):
        """Test sample data creation."""
        # Test user data
        self.assertIn('user_id', self.user)
        self.assertIn('preferences', self.user)
        self.assertIn('budget_min', self.user['preferences'])
        self.assertIn('budget_max', self.user['preferences'])
        
        # Test home data
        self.assertIn('home_id', self.home)
        self.assertIn('price', self.home)
        self.assertIn('bedrooms', self.home)
        self.assertIn('bathrooms', self.home)
    
    @patch('home_matching.ensemble.blend_scores.EnsembleScorer')
    def test_find_best_matches(self, mock_ensemble_class):
        """Test find_best_matches function."""
        # Mock the ensemble scorer
        mock_ensemble = Mock()
        mock_ensemble.rank_homes_for_user.return_value = [
            {
                'home_data': self.home,
                'home_id': self.home['home_id'],
                'final_score': 0.85,
                'rank': 1
            }
        ]
        mock_ensemble_class.return_value = mock_ensemble
        
        # Test the function
        matches = find_best_matches(self.user, [self.home], top_k=1)
        
        # Should return matches
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]['final_score'], 0.85)
        self.assertEqual(matches[0]['rank'], 1)
        
        # Verify ensemble was called correctly
        mock_ensemble.rank_homes_for_user.assert_called_once()
    
    @patch('home_matching.ensemble.blend_scores.EnsembleScorer')
    def test_score_single_match(self, mock_ensemble_class):
        """Test score_single_match function."""
        # Mock the ensemble scorer
        mock_ensemble = Mock()
        mock_ensemble.score_user_home_pair.return_value = {
            'user_id': self.user['user_id'],
            'home_id': self.home['home_id'],
            'final_score': 0.75,
            'scores': {
                'embedding': 0.8,
                'tabular': 0.7,
                'llm': 0.6
            }
        }
        mock_ensemble_class.return_value = mock_ensemble
        
        # Test the function
        result = score_single_match(self.user, self.home)
        
        # Should return scoring result
        self.assertEqual(result['final_score'], 0.75)
        self.assertIn('scores', result)
        self.assertEqual(result['scores']['embedding'], 0.8)
        
        # Verify ensemble was called correctly
        mock_ensemble.score_user_home_pair.assert_called_once()

class TestErrorHandling(unittest.TestCase):
    """Test error handling throughout the system."""
    
    def test_preprocessing_error_handling(self):
        """Test that preprocessing handles invalid data gracefully."""
        preprocessor = DataPreprocessor()
        
        # Test with invalid user data
        invalid_user = {'invalid': 'data'}
        processed = preprocessor.preprocess_user_data(invalid_user)
        
        # Should not crash and return something
        self.assertIsInstance(processed, dict)
        
        # Test with invalid home data
        invalid_home = {'invalid': 'data'}
        processed = preprocessor.preprocess_home_data(invalid_home)
        
        # Should not crash and return something
        self.assertIsInstance(processed, dict)
    
    def test_feature_engineering_error_handling(self):
        """Test that feature engineering handles missing data."""
        feature_engineer = FeatureEngineer()
        
        # Test with empty preferences and home data
        features = feature_engineer.create_all_features({}, {})
        
        # Should return numpy array even with empty data
        self.assertIsInstance(features, np.ndarray)
        self.assertGreater(len(features), 0)
    
    @patch('home_matching.ensemble.blend_scores.EmbeddingScorer')
    @patch('home_matching.ensemble.blend_scores.TabularPredictor') 
    @patch('home_matching.ensemble.blend_scores.LLMScorer')
    def test_ensemble_error_handling(self, mock_llm, mock_tabular, mock_embedding):
        """Test that ensemble handles scorer failures gracefully."""
        # Mock scorers to raise exceptions
        mock_embedding_instance = Mock()
        mock_embedding_instance.get_user_home_similarity.side_effect = Exception("Embedding failed")
        mock_embedding.return_value = mock_embedding_instance
        
        mock_tabular_instance = Mock()
        mock_tabular_instance.predict_match_score.side_effect = Exception("Tabular failed")
        mock_tabular.return_value = mock_tabular_instance
        
        mock_llm_instance = Mock()
        mock_llm_instance.llm_score.side_effect = Exception("LLM failed")
        mock_llm.return_value = mock_llm_instance
        
        # Create ensemble
        ensemble = EnsembleScorer()
        
        # Test scoring with failures
        user = create_sample_user()
        home = create_sample_home()
        
        result = ensemble.score_user_home_pair(user, home)
        
        # Should still return a result with final_score
        self.assertIn('final_score', result)
        self.assertIn('errors', result)
        self.assertEqual(len(result['errors']), 3)  # All three methods failed

if __name__ == '__main__':
    # Set up test environment
    import logging
    logging.basicConfig(level=logging.ERROR)  # Reduce log noise during tests
    
    # Run tests
    unittest.main(verbosity=2)
