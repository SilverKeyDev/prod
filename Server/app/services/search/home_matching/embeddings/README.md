# Embeddings Module

## Overview

The embeddings module computes similarity scores between users and homes using embedding models. It combines text embeddings (from sentence transformers or OpenAI) with structured numerical features to create comprehensive representations that capture both semantic and quantitative aspects of user preferences and home characteristics.

## Architecture

The module consists of several key components:

- **`scorer.py`**: Main `EmbeddingScorer` class that computes similarity scores
- **`user_encoder.py`**: Encodes user preferences into embedding vectors
- **`home_encoder.py`**: Encodes home listings into embedding vectors
- **`model_loader.py`**: Manages loading and caching of embedding models
- **`feature_config.py`**: Centralized configuration for structured feature extraction

## Key Features

### Hybrid Embedding Approach

The system uses a hybrid approach combining:

1. **Text Embeddings**: Semantic representations of text features (lifestyle, preferences, descriptions)
   - Uses sentence transformers (default) or OpenAI embeddings
   - Captures semantic meaning and relationships

2. **Structured Features**: Numerical features (price, bedrooms, bathrooms, etc.)
   - Normalized numerical values
   - Ensures consistent dimensions between users and homes

### Similarity Calculation

- **Cosine Similarity**: Primary method for comparing embeddings
- **Score Amplification**: Applies 5x amplification to make differences more pronounced
- **Dimension Validation**: Ensures user and home embeddings have matching dimensions

## Usage

### Basic Scoring

```python
from app.home_matching.embeddings.scorer import EmbeddingScorer

# Initialize scorer
scorer = EmbeddingScorer(
    embedding_provider="sentence_transformer",
    model="all-MiniLM-L6-v2"
)

# Get similarity score for a user-home pair
score = scorer.get_user_home_similarity(user_data, home_data)
print(f"Similarity score: {score:.3f}")  # 0.0-1.0
```

### Ranking Multiple Homes

```python
# Score user against multiple homes
scored_homes = scorer.score_user_against_homes(user_data, homes_data)

for home_data, score in scored_homes:
    print(f"Home {home_data['home_id']}: {score:.3f}")
```

### Top Matches

```python
# Get top-k matches
top_matches = scorer.get_top_matches(
    user_data,
    homes_data,
    top_k=10
)

for home_data, score in top_matches:
    print(f"Score: {score:.3f} - {home_data['home_id']}")
```

### Batch Scoring

```python
# Score multiple users against multiple homes
results = scorer.score_multiple_users_against_homes(users_data, homes_data)

for user_id, scored_homes in results.items():
    print(f"User {user_id}:")
    for home_data, score in scored_homes[:5]:  # Top 5
        print(f"  {home_data['home_id']}: {score:.3f}")
```

### Similarity Explanation

```python
# Get detailed explanation of similarity
explanation = scorer.explain_similarity(user_data, home_data)

print(f"Overall similarity: {explanation['overall_similarity']:.3f}")
print(f"Cosine similarity: {explanation['similarity_metrics']['cosine']:.3f}")
print(f"User preferences: {explanation['user_preferences']}")
print(f"Home features: {explanation['home_features']}")
```

## Components

### `scorer.py`

Main scoring interface:

- **`EmbeddingScorer`**: Primary class for embedding-based scoring
  - `get_user_home_similarity()`: Calculate similarity for a single pair
  - `score_user_against_homes()`: Score user against multiple homes
  - `score_multiple_users_against_homes()`: Batch scoring for multiple users
  - `get_top_matches()`: Get top-k matches for a user
  - `explain_similarity()`: Provide detailed similarity explanation

**Score Amplification:**
- Applies power function (x^0.2) to amplify differences
- Makes small score differences more pronounced
- Keeps scores in [0, 1] range

### `user_encoder.py`

User preference encoding:

- **`UserEncoder`**: Encodes user preferences into embeddings
  - `encode_user()`: Encode single user
  - `encode_users_batch()`: Encode multiple users efficiently
  - `get_embedding_dimension()`: Get total embedding dimension

**Text Features Extracted:**
- Lifestyle and work style
- Hobbies and family status
- Preferred home types and neighborhoods
- Must-have and nice-to-have amenities
- Location preferences
- Additional notes

**Structured Features:**
- Budget (min/max/range)
- Preferred bedrooms/bathrooms
- Minimum square footage
- Commute preferences
- Pet-friendly, parking, outdoor space requirements

### `home_encoder.py`

Home listing encoding:

- **`HomeEncoder`**: Encodes home listings into embeddings
  - `encode_home()`: Encode single home
  - `encode_homes_batch()`: Encode multiple homes efficiently
  - `get_embedding_dimension()`: Get total embedding dimension

**Text Features Extracted:**
- Address and description
- Home type and architectural style
- Condition and year built
- Bedrooms, bathrooms, square feet
- Amenities and features
- Neighborhood information
- Walkability, transit, and bike scores
- Nearby amenities

**Structured Features:**
- Price
- Bedrooms, bathrooms, square feet
- Lot size
- Age (from year built)
- Walkability, transit, bike scores
- Binary features (garage, yard, pool, etc.)

### `model_loader.py`

Embedding model management:

- **`EmbeddingModelLoader`**: Manages embedding models
  - `load_sentence_transformer()`: Load sentence transformer models
  - `get_openai_embedding()`: Get OpenAI embedding
  - `get_embeddings_batch()`: Batch embedding generation
  - `get_model_info()`: Get model metadata

**Supported Providers:**
- **Sentence Transformers**: Local models (default: "all-MiniLM-L6-v2")
- **OpenAI**: API-based embeddings ("text-embedding-ada-002")

**Features:**
- Model caching for performance
- Batch processing support
- Automatic retry with rate limit handling
- Dimension information

### `feature_config.py`

Centralized feature configuration:

- **`FeatureConfig`**: Manages feature extraction configuration
  - `extract_user_structured_features()`: Extract user numerical features
  - `extract_home_structured_features()`: Extract home numerical features
  - `get_embedding_dimension()`: Get total embedding dimensions
  - Ensures dimension consistency between users and homes

**Shared Features:**
- Price/budget (normalized to millions)
- Bedrooms, bathrooms (normalized to 10)
- Square feet (normalized to 10,000)
- Commute time (normalized to 120 minutes)
- Pet-friendly (binary)

**User-Specific Features:**
- Budget min, budget range
- Parking required, outdoor space required

**Home-Specific Features:**
- Lot size (normalized to 50,000 sqft)
- Age (normalized to 100 years)
- Walkability, transit, bike scores (normalized to 100)
- Has garage, yard, pool (binary)
- Recently renovated (binary)

## Configuration

Embedding settings are configured in `../config/settings.py`:

- `EMBEDDING_MODEL`: Default sentence transformer model
- `OPENAI_KEY`: OpenAI API key (if using OpenAI embeddings)

## Dimension Consistency

The system ensures user and home embeddings have matching dimensions:

1. **Text Embedding Dimension**: From embedding model (e.g., 384 for MiniLM)
2. **Structured Feature Dimension**: Union of all user and home features
3. **Total Dimension**: Text + Structured features

Both encoders use the same feature set (with padding for non-applicable features) to ensure compatibility.

## Performance Considerations

- **Batch Processing**: Encodes multiple items efficiently
- **Model Caching**: Models are loaded once and reused
- **Dimension Validation**: Checks dimensions before similarity calculation
- **Score Amplification**: Makes ranking more discriminative

## Score Amplification

The system applies a 5x amplification to embedding scores:

- **Purpose**: Make small differences between homes more pronounced
- **Method**: Power function (x^0.2) which effectively amplifies differences
- **Result**: A 0.01 difference becomes approximately 0.05 difference
- **Range**: Keeps scores in [0, 1] range

## Error Handling

- **Dimension Mismatches**: Logs warnings and returns 0.0 score
- **Encoding Errors**: Logs errors and raises exceptions
- **Model Loading**: Handles missing models gracefully
- **API Errors**: Retry logic for OpenAI API calls

## Output Format

### Similarity Score

Returns a float in the range [0.0, 1.0] representing similarity.

### Explanation Format

```python
{
    'overall_similarity': 0.75,
    'similarity_metrics': {
        'cosine': 0.75,
        'dot_product': 0.82,
        'euclidean': 0.25
    },
    'user_preferences': {
        'budget_range': '$300,000 - $500,000',
        'preferred_bedrooms': 3,
        'preferred_bathrooms': 2,
        'lifestyle': 'Urban professional'
    },
    'home_features': {
        'price': '$450,000',
        'bedrooms': 3,
        'bathrooms': 2,
        'sqft': '1,800 sq ft'
    },
    'embedding_dimensions': {
        'user_embedding_dim': 398,
        'home_embedding_dim': 398
    }
}
```

## Testing

See `test_embeddings.ipynb` for comprehensive testing examples and scenarios.
