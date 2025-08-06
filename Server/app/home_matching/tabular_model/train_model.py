"""
Tabular model training for XGBoost/LightGBM on user-home features.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import logging
from pathlib import Path

# ML libraries
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler

from ..config.settings import TABULAR_MODEL_TYPE, RANDOM_STATE, TABULAR_MODEL_PATH
from ..utils.feature_engineering import FeatureEngineer
from ..utils.preprocessing import DataPreprocessor
from ..utils.io import save_model, load_json

logger = logging.getLogger(__name__)

class TabularModelTrainer:
    """Trains tabular models for user-home matching."""
    
    def __init__(self, model_type: str = None):
        self.model_type = model_type or TABULAR_MODEL_TYPE
        self.feature_engineer = FeatureEngineer()
        self.preprocessor = DataPreprocessor()
        self.model = None
        self.scaler = None
        self.feature_names = None
        
        # Validate model availability
        if self.model_type == "xgboost" and not XGBOOST_AVAILABLE:
            logger.warning("XGBoost not available, falling back to LightGBM")
            self.model_type = "lightgbm"
        
        if self.model_type == "lightgbm" and not LIGHTGBM_AVAILABLE:
            logger.warning("LightGBM not available, falling back to XGBoost")
            self.model_type = "xgboost"
        
        if not XGBOOST_AVAILABLE and not LIGHTGBM_AVAILABLE:
            raise ImportError("Neither XGBoost nor LightGBM is available. Please install at least one.")
    
    def prepare_training_data(
        self, 
        user_home_pairs: List[Tuple[Dict[str, Any], Dict[str, Any], float]]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data from user-home pairs with scores."""
        try:
            X = []
            y = []
            
            for user_data, home_data, score in user_home_pairs:
                # Preprocess data
                user_processed = self.preprocessor.preprocess_user_data(user_data)
                home_processed = self.preprocessor.preprocess_home_data(home_data)
                
                # Create features
                features = self.feature_engineer.create_all_features(
                    user_processed.get('preferences', {}), 
                    home_processed
                )
                
                X.append(features)
                y.append(score)
            
            X = np.array(X)
            y = np.array(y)
            
            # Store feature names
            self.feature_names = self.feature_engineer.get_feature_names()
            
            logger.info(f"Prepared training data: {X.shape[0]} samples, {X.shape[1]} features")
            return X, y
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            raise
    
    def create_synthetic_training_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Create synthetic training data for initial model training."""
        try:
            np.random.seed(RANDOM_STATE)
            
            X = []
            y = []
            
            for _ in range(n_samples):
                # Generate synthetic user preferences
                user_data = {
                    'user_id': f'synthetic_user_{_}',
                    'preferences': {
                        'budget_min': np.random.randint(200000, 500000),
                        'budget_max': np.random.randint(500000, 1500000),
                        'preferred_bedrooms': np.random.randint(1, 6),
                        'preferred_bathrooms': np.random.uniform(1, 4),
                        'min_sqft': np.random.randint(800, 4000),
                        'max_commute_minutes': np.random.randint(15, 60),
                        'must_have_amenities': np.random.choice(['garage', 'yard', 'pool'], size=np.random.randint(0, 3), replace=False).tolist(),
                        'preferred_home_types': [np.random.choice(['house', 'condo', 'townhouse'])],
                        'pet_friendly': np.random.choice([True, False]),
                        'parking_required': np.random.choice([True, False])
                    }
                }
                
                # Generate synthetic home data
                home_data = {
                    'home_id': f'synthetic_home_{_}',
                    'price': np.random.randint(300000, 1200000),
                    'bedrooms': np.random.randint(1, 6),
                    'bathrooms': np.random.uniform(1, 4),
                    'sqft': np.random.randint(800, 4000),
                    'home_type': np.random.choice(['house', 'condo', 'townhouse']),
                    'commute_minutes': np.random.randint(10, 90),
                    'amenities': np.random.choice(['garage', 'yard', 'pool', 'gym'], size=np.random.randint(0, 4), replace=False).tolist(),
                    'has_garage': np.random.choice([True, False]),
                    'has_yard': np.random.choice([True, False]),
                    'pet_friendly': np.random.choice([True, False])
                }
                
                # Create features
                user_processed = self.preprocessor.preprocess_user_data(user_data)
                home_processed = self.preprocessor.preprocess_home_data(home_data)
                
                features = self.feature_engineer.create_all_features(
                    user_processed.get('preferences', {}), 
                    home_processed
                )
                
                # Generate synthetic score based on feature compatibility
                score = self._calculate_synthetic_score(user_processed.get('preferences', {}), home_processed)
                
                X.append(features)
                y.append(score)
            
            X = np.array(X)
            y = np.array(y)
            
            # Store feature names
            self.feature_names = self.feature_engineer.get_feature_names()
            
            logger.info(f"Created synthetic training data: {X.shape[0]} samples, {X.shape[1]} features")
            return X, y
            
        except Exception as e:
            logger.error(f"Error creating synthetic training data: {e}")
            raise
    
    def _calculate_synthetic_score(self, user_prefs: Dict[str, Any], home_data: Dict[str, Any]) -> float:
        """Calculate synthetic compatibility score for training data generation."""
        score = 0.0
        
        # Price compatibility (30% weight)
        budget_min = user_prefs.get('budget_min', 0)
        budget_max = user_prefs.get('budget_max', 0)
        home_price = home_data.get('price', 0)
        
        if budget_min <= home_price <= budget_max:
            score += 0.3
        elif home_price <= budget_max * 1.1:  # 10% tolerance
            score += 0.2
        
        # Size compatibility (25% weight)
        pref_bedrooms = user_prefs.get('preferred_bedrooms', 0)
        home_bedrooms = home_data.get('bedrooms', 0)
        bedroom_diff = abs(pref_bedrooms - home_bedrooms)
        
        if bedroom_diff == 0:
            score += 0.15
        elif bedroom_diff <= 1:
            score += 0.1
        
        pref_bathrooms = user_prefs.get('preferred_bathrooms', 0)
        home_bathrooms = home_data.get('bathrooms', 0)
        bathroom_diff = abs(pref_bathrooms - home_bathrooms)
        
        if bathroom_diff <= 0.5:
            score += 0.1
        elif bathroom_diff <= 1:
            score += 0.05
        
        # Commute compatibility (20% weight)
        max_commute = user_prefs.get('max_commute_minutes', 60)
        home_commute = home_data.get('commute_minutes', 30)
        
        if home_commute <= max_commute:
            score += 0.2 * (1 - home_commute / max_commute)
        
        # Amenity compatibility (15% weight)
        must_have = set(user_prefs.get('must_have_amenities', []))
        home_amenities = set(home_data.get('amenities', []))
        
        if must_have:
            amenity_match = len(must_have.intersection(home_amenities)) / len(must_have)
            score += 0.15 * amenity_match
        else:
            score += 0.15  # No requirements = perfect match
        
        # Type compatibility (10% weight)
        pref_types = user_prefs.get('preferred_home_types', [])
        home_type = home_data.get('home_type', '')
        
        if home_type in pref_types:
            score += 0.1
        
        # Add some noise
        score += np.random.normal(0, 0.05)
        
        return max(0.0, min(1.0, score))
    
    def train_model(self, X: np.ndarray, y: np.ndarray, validation_split: float = 0.2) -> Dict[str, Any]:
        """Train the tabular model."""
        try:
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=validation_split, random_state=RANDOM_STATE
            )
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)
            
            # Train model based on type
            if self.model_type == "xgboost":
                self.model = self._train_xgboost(X_train_scaled, y_train, X_val_scaled, y_val)
            elif self.model_type == "lightgbm":
                self.model = self._train_lightgbm(X_train_scaled, y_train, X_val_scaled, y_val)
            else:
                raise ValueError(f"Unknown model type: {self.model_type}")
            
            # Evaluate model
            train_pred = self.model.predict(X_train_scaled)
            val_pred = self.model.predict(X_val_scaled)
            
            metrics = {
                'train_rmse': np.sqrt(mean_squared_error(y_train, train_pred)),
                'val_rmse': np.sqrt(mean_squared_error(y_val, val_pred)),
                'train_mae': mean_absolute_error(y_train, train_pred),
                'val_mae': mean_absolute_error(y_val, val_pred),
                'train_r2': r2_score(y_train, train_pred),
                'val_r2': r2_score(y_val, val_pred)
            }
            
            logger.info(f"Model training completed. Validation RMSE: {metrics['val_rmse']:.4f}, R²: {metrics['val_r2']:.4f}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise
    
    def _train_xgboost(self, X_train: np.ndarray, y_train: np.ndarray, 
                      X_val: np.ndarray, y_val: np.ndarray) -> xgb.XGBRegressor:
        """Train XGBoost model."""
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=RANDOM_STATE,
            early_stopping_rounds=10,
            eval_metric='rmse'
        )
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        return model
    
    def _train_lightgbm(self, X_train: np.ndarray, y_train: np.ndarray,
                       X_val: np.ndarray, y_val: np.ndarray) -> lgb.LGBMRegressor:
        """Train LightGBM model."""
        model = lgb.LGBMRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=RANDOM_STATE,
            early_stopping_rounds=10,
            metric='rmse'
        )
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)]
        )
        
        return model
    
    def save_model(self, model_path: str = None) -> None:
        """Save trained model and scaler."""
        try:
            model_path = model_path or str(TABULAR_MODEL_PATH)
            
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'model_type': self.model_type
            }
            
            save_model(model_data, model_path)
            logger.info(f"Model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from trained model."""
        try:
            if self.model is None:
                raise ValueError("Model not trained yet")
            
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
            else:
                raise ValueError("Model does not support feature importance")
            
            if self.feature_names:
                return dict(zip(self.feature_names, importances))
            else:
                return {f'feature_{i}': imp for i, imp in enumerate(importances)}
                
        except Exception as e:
            logger.error(f"Error getting feature importance: {e}")
            return {}

def train_model_from_data(training_data_path: str = None, use_synthetic: bool = True) -> TabularModelTrainer:
    """Train model from data file or synthetic data."""
    trainer = TabularModelTrainer()
    
    if use_synthetic or not training_data_path:
        logger.info("Using synthetic training data")
        X, y = trainer.create_synthetic_training_data(n_samples=5000)
    else:
        logger.info(f"Loading training data from {training_data_path}")
        # Load real training data (implement based on your data format)
        # This would load user-home pairs with ground truth scores
        raise NotImplementedError("Real training data loading not implemented yet")
    
    # Train model
    metrics = trainer.train_model(X, y)
    
    # Save model
    trainer.save_model()
    
    # Print feature importance
    importance = trainer.get_feature_importance()
    logger.info("Top 10 most important features:")
    for feature, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]:
        logger.info(f"  {feature}: {imp:.4f}")
    
    return trainer

if __name__ == "__main__":
    # Train model with synthetic data
    trainer = train_model_from_data(use_synthetic=True)
    print("Model training completed successfully!")
