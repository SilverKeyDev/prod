# Home Matching System

A comprehensive AI-powered home matching system that combines embedding-based similarity, tabular machine learning models, and LLM-based scoring to provide personalized home recommendations with detailed explanations.

## Features

- **Multi-Modal Scoring**: Combines three complementary approaches:
  - **Embedding Similarity** (40% weight): Semantic similarity using sentence transformers or OpenAI embeddings
  - **Tabular Model** (40% weight): XGBoost/LightGBM regression on engineered features
  - **LLM Scoring** (20% weight): OpenAI GPT-based reasoning and explanation

- **Explainable Recommendations**: Detailed explanations for each match including pros, cons, and reasoning
- **Flexible Configuration**: Customizable ensemble weights and model parameters
- **Batch Processing**: Efficient scoring of multiple user-home pairs
- **Comprehensive Testing**: Full unit test coverage with error handling

## Project Structure

```
home_matching/
├── config/                 # Configuration and settings
│   └── settings.py
├── data/                   # Data storage
│   ├── raw/               # Raw input data
│   ├── processed/         # Processed data
│   └── samples/           # Sample data files
├── utils/                  # Core utilities
│   ├── io.py              # Data loading/saving
│   ├── preprocessing.py   # Data cleaning and preprocessing
│   ├── feature_engineering.py  # Feature creation
│   └── similarity.py      # Similarity calculations
├── embeddings/            # Embedding-based scoring
│   ├── model_loader.py    # Model loading and caching
│   ├── user_encoder.py    # User preference encoding
│   ├── home_encoder.py    # Home data encoding
│   └── scorer.py          # Embedding similarity scoring
├── tabular_model/         # Traditional ML models
│   ├── train_model.py     # Model training
│   └── predict.py         # Prediction and scoring
├── llm_scorer/            # LLM-based scoring
│   ├── prompt_builder.py  # Prompt construction
│   ├── llm_client.py      # API client with retry logic
│   ├── parser.py          # Response parsing
│   └── scorer.py          # LLM scoring orchestration
├── ensemble/              # Score blending
│   └── blend_scores.py    # Ensemble scoring logic
├── app/                   # Application entry points
│   ├── match.py           # Main matching functions
│   └── demo.ipynb         # Interactive demo notebook
└── tests/                 # Unit tests
    └── test_matching.py   # Comprehensive test suite
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd SilverKey
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```


## Quick Start

### Basic Usage

```python
from home_matching.app.match import find_best_matches, create_sample_user, create_sample_home

# Create sample data
user = create_sample_user()
homes = [create_sample_home() for _ in range(5)]

# Find best matches
matches = find_best_matches(user, homes, top_k=3, include_explanations=True)

# Display results
for match in matches:
    print(f"#{match['rank']} - {match['home_id']}: {match['final_score']:.3f}")
    if 'llm_explanation' in match:
        print(f"  Reasoning: {match['llm_explanation']['reasoning']}")
```

### Single Home Scoring

```python
from home_matching.app.match import score_single_match

result = score_single_match(user, home, include_explanations=True)
print(f"Final Score: {result['final_score']:.3f}")
print(f"Method Scores: {result['scores']}")
```

### Custom Ensemble Weights

```python
# Emphasize LLM reasoning
matches = find_best_matches(
    user, homes,
    method_weights={'embedding': 0.2, 'tabular': 0.2, 'llm': 0.6}
)
```

## Demo Notebook

Run the interactive demo to explore the system:

```bash
cd home_matching/app
jupyter notebook demo.ipynb
```

The demo covers:
- System overview and configuration
- Sample data creation
- Single home scoring with explanations
- Batch matching and ranking
- Method comparison and analysis
- Custom weight experiments
- Performance statistics

## Testing

Run the comprehensive test suite:

```bash
python -m pytest tests/ -v --cov=home_matching
```

Or run specific test categories:

```bash
# Test data preprocessing
python -m pytest tests/test_matching.py::TestDataPreprocessing -v

# Test ensemble scoring
python -m pytest tests/test_matching.py::TestEnsembleScorer -v

# Test error handling
python -m pytest tests/test_matching.py::TestErrorHandling -v
```

## Configuration

Key settings in `config/settings.py`:

```python
# Model Configuration
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
TABULAR_MODEL_TYPE = "xgboost"
LLM_MODEL_NAME = "gpt-3.5-turbo"

# Ensemble Weights
DEFAULT_EMBEDDING_WEIGHT = 0.4
DEFAULT_TABULAR_WEIGHT = 0.4
DEFAULT_LLM_WEIGHT = 0.2

# Scoring Thresholds
MIN_SIMILARITY_THRESHOLD = 0.1
MAX_HOMES_TO_RANK = 100
```

## Data Format

### User Preferences

```json
{
  "user_id": "user_123",
  "preferences": {
    "budget_min": 400000,
    "budget_max": 800000,
    "preferred_bedrooms": 3,
    "preferred_bathrooms": 2.5,
    "min_sqft": 1800,
    "lifestyle": "Active professional",
    "must_have_amenities": ["garage", "yard"],
    "nice_to_have_amenities": ["pool", "gym"],
    "housing_type": "house",
    "max_commute_minutes": 30
  }
}
```

### Home Data

```json
{
  "home_id": "home_456",
  "address": "123 Main St, City, ST 12345",
  "price": 650000,
  "bedrooms": 3,
  "bathrooms": 2.5,
  "sqft": 2100,
  "home_type": "house",
  "style": "contemporary",
  "neighborhood": "Downtown",
  "amenities": ["garage", "yard", "pool"],
  "has_garage": true,
  "has_yard": true,
  "has_pool": true,
  "pet_friendly": true,
  "commute_minutes": 25,
  "description": "Beautiful contemporary home with modern amenities."
}
```

## API Reference

### Main Functions

- `find_best_matches(user, homes, top_k=10, **kwargs)`: Find and rank top matches
- `score_single_match(user, home, **kwargs)`: Score a single user-home pair
- `compare_homes_for_user(user, homes, **kwargs)`: Compare multiple homes with analysis
- `batch_match_users(users, homes, **kwargs)`: Batch process multiple users

### Key Classes

- `EnsembleScorer`: Main scoring orchestrator
- `EmbeddingScorer`: Embedding-based similarity scoring
- `TabularPredictor`: Traditional ML model predictions
- `LLMScorer`: LLM-based reasoning and scoring
- `DataPreprocessor`: Data cleaning and normalization
- `FeatureEngineer`: Feature extraction and engineering

## Performance Considerations

- **Embedding Caching**: Models and embeddings are cached for efficiency
- **Batch Processing**: Use batch methods for multiple homes/users
- **API Rate Limits**: LLM scoring includes retry logic and rate limiting
- **Memory Management**: Large datasets are processed in chunks


