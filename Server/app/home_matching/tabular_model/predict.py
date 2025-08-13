"""
Tabular model prediction for user-home match scores.
"""

import numpy as np
from typing import Dict, List, Any, Optional
import logging
from pathlib import Path

from ..config.settings import TABULAR_MODEL_PATH
from ..utils.feature_engineering import FeatureEngineer
from ..utils.preprocessing import DataPreprocessor
from ..utils.io import load_model

logger = logging.getLogger(__name__)

class TabularPredictor:
    """Predicts match scores using trained tabular model."""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or str(TABULAR_MODEL_PATH)
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_type = None
        self.feature_engineer = FeatureEngineer()
        self.preprocessor = DataPreprocessor()
        self.is_loaded = False
    
    def load_model(self) -> None:
        """Load trained model and scaler."""
        try:
            if not Path(self.model_path).exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            model_data = load_model(self.model_path)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data.get('feature_names', None)
            self.model_type = model_data.get('model_type', 'unknown')
            
            self.is_loaded = True
            logger.info(f"Loaded {self.model_type} model from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def predict_match_score(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
        """Predict match score for a user-home pair."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            # Preprocess data
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            home_processed = self.preprocessor.preprocess_home_data(home_data)
            
            # Create features
            features = self.feature_engineer.create_all_features(
                user_processed.get('preferences', {}), 
                home_processed
            )
            
            # Scale features
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            
            # Predict
            score = self.model.predict(features_scaled)[0]
            
            # Ensure score is in [0, 1] range
            score = max(0.0, min(1.0, score))
            

            return float(score)
            
        except Exception as e:
            logger.error(f"Error predicting match score: {e}")
            return 0.0
    
    def predict_batch(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> List[float]:
        """Predict match scores for a user against multiple homes."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            if not homes_data:
                return []
            
            # Preprocess user data once
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            user_prefs = user_processed.get('preferences', {})
            
            # Create features for all homes
            all_features = []
            for home_data in homes_data:
                home_processed = self.preprocessor.preprocess_home_data(home_data)
                features = self.feature_engineer.create_all_features(user_prefs, home_processed)
                all_features.append(features)
            
            # Stack features and scale
            X = np.array(all_features)
            X_scaled = self.scaler.transform(X)
            
            # Predict all scores
            scores = self.model.predict(X_scaled)
            
            # Ensure scores are in [0, 1] range
            scores = np.clip(scores, 0.0, 1.0)
            

            return scores.tolist()
            
        except Exception as e:
            logger.error(f"Error predicting batch scores: {e}")
            return [0.0] * len(homes_data)
    
    def predict_with_explanation(
        self, 
        user_data: Dict[str, Any], 
        home_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Predict match score with feature-level explanation."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            # Get prediction
            score = self.predict_match_score(user_data, home_data)
            
            # Create features for analysis
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            home_processed = self.preprocessor.preprocess_home_data(home_data)
            
            features = self.feature_engineer.create_all_features(
                user_processed.get('preferences', {}), 
                home_processed
            )
            
            # Get feature importance (if available)
            feature_importance = {}
            if hasattr(self.model, 'feature_importances_') and self.feature_names:
                feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
            
            # Calculate feature contributions (approximate)
            feature_contributions = {}
            if self.feature_names and len(features) == len(self.feature_names):
                for i, (name, value) in enumerate(zip(self.feature_names, features)):
                    importance = feature_importance.get(name, 0.0)
                    contribution = value * importance
                    feature_contributions[name] = {
                        'value': float(value),
                        'importance': float(importance),
                        'contribution': float(contribution)
                    }
            
            explanation = {
                'predicted_score': score,
                'model_type': self.model_type,
                'feature_contributions': feature_contributions,
                'top_positive_features': [],
                'top_negative_features': [],
                'user_home_summary': {
                    'user_budget': f"${user_processed.get('preferences', {}).get('budget_min', 0):,} - ${user_processed.get('preferences', {}).get('budget_max', 0):,}",
                    'home_price': f"${home_processed.get('price', 0):,}",
                    'user_bedrooms': user_processed.get('preferences', {}).get('preferred_bedrooms', 'Not specified'),
                    'home_bedrooms': home_processed.get('bedrooms', 'Not specified'),
                    'user_bathrooms': user_processed.get('preferences', {}).get('preferred_bathrooms', 'Not specified'),
                    'home_bathrooms': home_processed.get('bathrooms', 'Not specified')
                }
            }
            
            # Sort features by contribution
            if feature_contributions:
                sorted_features = sorted(
                    feature_contributions.items(), 
                    key=lambda x: x[1]['contribution'], 
                    reverse=True
                )
                
                explanation['top_positive_features'] = [
                    {'name': name, **data} 
                    for name, data in sorted_features[:5] 
                    if data['contribution'] > 0
                ]
                
                explanation['top_negative_features'] = [
                    {'name': name, **data} 
                    for name, data in sorted_features[-5:] 
                    if data['contribution'] < 0
                ]
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error predicting with explanation: {e}")
            return {
                'predicted_score': 0.0,
                'error': str(e)
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        try:
            if not self.is_loaded:
                self.load_model()
            
            info = {
                'model_type': self.model_type,
                'model_path': self.model_path,
                'feature_count': len(self.feature_names) if self.feature_names else 0,
                'feature_names': self.feature_names,
                'is_loaded': self.is_loaded
            }
            
            # Add model-specific info
            if hasattr(self.model, 'n_estimators'):
                info['n_estimators'] = self.model.n_estimators
            if hasattr(self.model, 'max_depth'):
                info['max_depth'] = self.model.max_depth
            if hasattr(self.model, 'learning_rate'):
                info['learning_rate'] = self.model.learning_rate
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {'error': str(e)}

# Global predictor instance
_global_predictor = None

def get_predictor(model_path: str = None) -> TabularPredictor:
    """Get global predictor instance (singleton pattern)."""
    global _global_predictor
    
    if _global_predictor is None or (model_path and model_path != _global_predictor.model_path):
        _global_predictor = TabularPredictor(model_path)
    
    return _global_predictor

def predict_match_score(user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
    """Convenience function for single prediction."""
    predictor = get_predictor()
    return predictor.predict_match_score(user_data, home_data)

def predict_batch_scores(user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> List[float]:
    """Convenience function for batch prediction."""
    predictor = get_predictor()
    return predictor.predict_batch(user_data, homes_data)
