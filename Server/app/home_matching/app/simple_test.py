"""
Simple test script to verify basic functionality without heavy dependencies.
"""

import sys
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import time
import logging
from typing import List, Dict, Any

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("🧪 Starting Simple Home Matching System Test")
print("=" * 50)

# Test 1: Basic imports
print("1. Testing basic imports...")
try:
    import numpy as np
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
    print("   ✅ NumPy, Pandas, Matplotlib, Seaborn imported successfully")
except ImportError as e:
    print(f"   ❌ Basic imports failed: {e}")

# Test 2: Check PyTorch
print("\n2. Testing PyTorch...")
try:
    import torch
    print(f"   ✅ PyTorch version: {torch.__version__}")
except ImportError as e:
    print(f"   ❌ PyTorch import failed: {e}")

# Test 3: Check sentence-transformers
print("\n3. Testing sentence-transformers...")
try:
    from sentence_transformers import SentenceTransformer
    print("   ✅ sentence-transformers imported successfully")
except ImportError as e:
    print(f"   ❌ sentence-transformers import failed: {e}")

# Test 4: Check OpenAI
print("\n4. Testing OpenAI...")
try:
    import openai
    print(f"   ✅ OpenAI version: {openai.__version__}")
except ImportError as e:
    print(f"   ❌ OpenAI import failed: {e}")

# Test 5: Check ML libraries
print("\n5. Testing ML libraries...")
try:
    import xgboost as xgb
    import lightgbm as lgb
    import sklearn
    print(f"   ✅ XGBoost: {xgb.__version__}")
    print(f"   ✅ LightGBM: {lgb.__version__}")
    print(f"   ✅ Scikit-learn: {sklearn.__version__}")
except ImportError as e:
    print(f"   ❌ ML libraries import failed: {e}")

# Test 6: Try importing home_matching components individually
print("\n6. Testing home_matching components...")

# Test config
try:
    from home_matching.config import settings
    print("   ✅ Config imported successfully")
except ImportError as e:
    print(f"   ❌ Config import failed: {e}")

# Test utils
try:
    from home_matching.utils.preprocessing import DataPreprocessor
    from home_matching.utils.feature_engineering import FeatureEngineer
    print("   ✅ Utils imported successfully")
except ImportError as e:
    print(f"   ❌ Utils import failed: {e}")

# Test tabular model (should work without embeddings)
try:
    from home_matching.tabular_model.train_model import TabularModelTrainer
    print("   ✅ Tabular model imported successfully")
except ImportError as e:
    print(f"   ❌ Tabular model import failed: {e}")

# Test 7: Create sample data and test basic functionality
print("\n7. Testing basic functionality...")
try:
    # Create simple test data
    def create_simple_user():
        return {
            'user_id': 'test_user_001',
            'preferences': {
                'budget_min': 400000,
                'budget_max': 800000,
                'preferred_bedrooms': 3,
                'preferred_bathrooms': 2.5,
                'min_sqft': 1800,
                'lifestyle': 'Young Professional',
                'must_have_amenities': ['garage'],
                'nice_to_have_amenities': ['pool'],
                'housing_type': 'house',
                'max_commute_minutes': 30
            }
        }
    
    def create_simple_home():
        return {
            'home_id': 'test_home_001',
            'address': '123 Test St, Test City, ST 12345',
            'price': 650000,
            'bedrooms': 3,
            'bathrooms': 2.5,
            'sqft': 2100,
            'home_type': 'house',
            'style': 'contemporary',
            'neighborhood': 'Downtown',
            'amenities': ['garage', 'yard'],
            'has_garage': True,
            'has_yard': True,
            'has_pool': False,
            'pet_friendly': True,
            'commute_minutes': 25,
            'description': 'Beautiful contemporary home'
        }
    
    user = create_simple_user()
    home = create_simple_home()
    
    print("   ✅ Sample data created successfully")
    
    # Test preprocessing
    from home_matching.utils.preprocessing import DataPreprocessor
    preprocessor = DataPreprocessor()
    
    processed_user = preprocessor.preprocess_user_data(user)
    processed_home = preprocessor.preprocess_home_data(home)
    
    print("   ✅ Data preprocessing works")
    
    # Test feature engineering
    from home_matching.utils.feature_engineering import FeatureEngineer
    feature_engineer = FeatureEngineer()
    
    features = feature_engineer.create_all_features(
        processed_user['preferences'], 
        processed_home
    )
    
    print(f"   ✅ Feature engineering works - created {len(features)} features")
    
except Exception as e:
    print(f"   ❌ Basic functionality test failed: {e}")

# Test 8: Create a simple visualization
print("\n8. Testing visualization...")
try:
    # Create a simple performance chart
    plt.figure(figsize=(10, 6))
    
    # Simulate some performance data
    batch_sizes = [1, 5, 10, 20, 30]
    processing_times = [0.1, 0.3, 0.5, 0.8, 1.2]
    
    plt.subplot(1, 2, 1)
    plt.plot(batch_sizes, processing_times, 'bo-', linewidth=2, markersize=8)
    plt.xlabel('Batch Size')
    plt.ylabel('Processing Time (seconds)')
    plt.title('Simulated Performance Test')
    plt.grid(True, alpha=0.3)
    
    # Create a score distribution
    plt.subplot(1, 2, 2)
    scores = np.random.normal(0.6, 0.2, 100)
    scores = np.clip(scores, 0, 1)  # Clip to [0,1] range
    
    plt.hist(scores, bins=20, alpha=0.7, color='skyblue', edgecolor='black')
    plt.xlabel('Score')
    plt.ylabel('Frequency')
    plt.title('Simulated Score Distribution')
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('/Users/jaycewalzer/Desktop/SilverKey/home_matching/app/simple_test_results.png', 
                dpi=150, bbox_inches='tight')
    plt.close()
    
    print("   ✅ Visualization test successful - saved to simple_test_results.png")
    
except Exception as e:
    print(f"   ❌ Visualization test failed: {e}")

print("\n" + "=" * 50)
print("🏁 Simple test completed!")
print("\nNext steps:")
print("1. If PyTorch/sentence-transformers failed, try: conda install pytorch")
print("2. If all tests pass, the embedding issue might be environment-specific")
print("3. Consider using OpenAI embeddings as fallback if sentence-transformers fails")
print("4. The core system (preprocessing, features, tabular models) should work independently")
