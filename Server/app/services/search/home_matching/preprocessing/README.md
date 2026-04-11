# Home Matching Preprocessing System

## Overview

This preprocessing system provides a structured approach to data preparation for different scoring methods in the home matching system. Each scoring method (embedding, LLM) requires data in different formats:

- **Embedding models**: Need text features for semantic similarity + structured numerical features
- **LLM models**: Need formatted text prompts with all relevant information

## Architecture

### Data Flow

```
Raw Data (DB/API)
    ↓
Dictionary (standard format)
    ↓
    ├─→ EmbeddingHomeInput / EmbeddingUserInput (text + structured)
    └─→ LLMHomeInput / LLMUserInput (formatted text)
```

### Model Hierarchy

1. **Embedding Models** (`EmbeddingHomeInput`, `EmbeddingUserInput`)
   - Optimized for embedding-based similarity
   - Includes text features (via `extract_text_features()`)
   - Includes structured numerical features
   - Created from dictionaries using `from_dict()` or `EmbeddingUserInput.from_dict()`

2. **LLM Models** (`LLMHomeInput`, `LLMUserInput`)
   - Optimized for prompt building
   - Includes `format_for_prompt()` method
   - Contains all text and structured data formatted for LLM consumption
   - Created from dictionaries using `from_dict()` or `LLMUserInput.from_dict()`

## Usage

### Retrieving Data

```python
from app.home_matching.preprocessing.models import (
    UserDataRetriever, HomeDataRetriever
)

# Get data as dictionary (standard format)
user_data = UserDataRetriever.from_database(user_id="123")
home_data = HomeDataRetriever.from_database(home_id="456")

# Convert to specific format needed by scorer
embedding_user = UserDataRetriever.to_embedding_input(user_data)
llm_user = UserDataRetriever.to_llm_input(user_data)
```

### Using with Scorers

#### Embedding Scorer
```python
from app.home_matching.embeddings.scorer import EmbeddingScorer

# Embedding scorer accepts dicts (backward compatible)
# But you can use the model's to_dict() method
embedding_scorer = EmbeddingScorer()
score = embedding_scorer.get_user_home_similarity(
    embedding_user.to_dict(),
    embedding_home.to_dict()
)
```

#### LLM Scorer
```python
from app.home_matching.llm_scorer.scorer import LLMScorer

# LLM scorer accepts dicts but can use formatted prompts
llm_scorer = LLMScorer()
score = llm_scorer.llm_score(
    llm_user.to_dict(),
    llm_home.to_dict()
)

# Or use the format_for_prompt() method directly
user_prompt = llm_user.format_for_prompt()
home_prompt = llm_home.format_for_prompt()
```

#### Tabular Scorer (if implemented)
```python
from app.home_matching.utils.feature_engineering import FeatureEngineer

# Tabular models provide numerical features
feature_engineer = FeatureEngineer()
user_features = tabular_user.extract_numerical_features()
home_features = tabular_home.extract_numerical_features()

# Use with tabular model
features = feature_engineer.create_all_features(
    tabular_user.to_dict()['preferences'],
    tabular_home.to_dict()
)
```

## Data Retrieval Functions

### User Data

- `get_user_data_from_db(user_id)` - Returns dict
- `get_user_data(user_id, user_data_dict)` - Main entry point, returns dict

### Home Data

- `get_home_data_from_db(home_id, user_id)` - Returns dict
- `get_home_data(home_id, user_id, home_data_dict)` - Main entry point, returns dict

## Model Conversion

Models can be created from dictionaries:

```python
# Dictionary → Model formats
user_data = get_user_data(user_id="123")
embedding_user = EmbeddingUserInput.from_dict(user_data)
llm_user = LLMUserInput.from_dict(user_data)

# Or use convenience methods
embedding_user = UserDataRetriever.to_embedding_input(user_data)
llm_user = UserDataRetriever.to_llm_input(user_data)

# All models → Dict (for backward compatibility)
data_dict = model.to_dict()
```

## Key Features

1. **Type Safety**: Models provide type hints and validation
2. **Efficiency**: Single data retrieval, multiple format conversions
3. **Clarity**: Each model type clearly indicates its purpose
4. **Backward Compatibility**: All models can convert to dicts for existing code
5. **Extensibility**: Easy to add new model types or features

## Best Practices

1. **Retrieve data as dictionaries first** - standard format from database/API
2. **Convert to specific format only when needed** - avoids unnecessary conversions
3. **Use model methods** - prefer `extract_text_features()` over manual dict access
4. **Validate data** - use `model.validate()` before processing
5. **Handle None values** - all models handle optional fields gracefully

## File Structure

```
preprocessing/
├── models/
│   ├── base.py              # Base model class
│   ├── embedding_input.py    # Embedding format
│   ├── llm_input.py         # LLM format
│   ├── data_retrieval.py    # Retrieval wrappers
│   └── __init__.py          # Exports
├── home_input_data.py       # Home data retrieval
├── user_input_data.py       # User data retrieval
└── README.md                # This file
```
