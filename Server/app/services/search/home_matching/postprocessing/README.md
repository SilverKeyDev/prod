# Ensemble Scoring Module

## Overview

The ensemble module combines scores from multiple scoring methods (embedding-based and LLM-based) to produce a final compatibility score between users and homes. It uses weighted averaging to blend the different scoring approaches, providing a more robust and comprehensive matching system.

The module also includes a machine learning system for learning optimal weights per user or cohort based on their interaction history, enabling personalized score blending.

## Architecture

The ensemble system consists of several components:

- **`EnsembleScorer`**: Main class that orchestrates scoring from multiple methods and blends the results
- **`blend_scores.py`**: Core blending logic and ensemble scorer implementation
- **`batch_scoring.py`**: Batch processing utilities for scoring multiple homes concurrently
- **`comparison.py`**: Comparison and correlation analysis between different scoring methods
- **`stats.py`**: Statistics and performance tracking for ensemble scoring
- **`weight_service.py`**: Service for retrieving and managing learned weights
- **`weight_learner.py`**: Logistic regression-based weight learning from user interactions
- **`weight_training_data.py`**: Training data extraction from user impressions and likes
- **`weight_training_job.py`**: Background job for periodic weight retraining
- **`cohort_assigner.py`**: Cohort assignment logic for grouping similar users

## Key Features

### Weighted Score Blending

The ensemble uses configurable weights to combine embedding and LLM scores:

- **Embedding Weight**: Controls the influence of embedding-based similarity scores
- **LLM Weight**: Controls the influence of LLM-based reasoning scores
- Weights are automatically normalized to sum to 1.0

### Learned Weights (Personalization)

The system can automatically learn optimal weights for individual users or cohorts:

- **User-specific weights**: Trained on each user's interaction history (likes/dislikes)
- **Cohort weights**: Fallback weights for users grouped by demographics/preferences
- **Automatic retraining**: Weights are retrained when sufficient new data is available
- **Logistic regression**: Uses logistic regression to learn optimal blending weights

### Score Processing

1. **Normalization**: Ensures all scores are in the [0, 1] range
2. **Weighted Combination**: Calculates weighted average of embedding and LLM scores
3. **Post-processing**: Scales final score to 0-100 range with one decimal precision

### Concurrent Batch Processing

- Processes homes in batches of 3 for optimal concurrency
- Uses `ThreadPoolExecutor` for parallel scoring
- Maintains proper ordering of results
- Handles errors gracefully at the batch level

## Usage

### Basic Usage

```python
from app.home_matching.postprocessing.blend_scores import EnsembleScorer

# Initialize with default weights
ensemble = EnsembleScorer()

# Score a single user-home pair
result = ensemble.score_user_home_pair(user_data, home_data)
print(f"Final score: {result['final_score']}")
print(f"Embedding score: {result['scores']['embedding']}")
print(f"LLM score: {result['scores']['llm']}")
```

### Using Learned Weights

```python
# Initialize with user_id to use learned weights
ensemble = EnsembleScorer(
    user_id="user_123",
    use_learned_weights=True  # Default is True
)

# The system will automatically:
# 1. Try to load existing learned weights for the user
# 2. Fall back to cohort weights if user weights don't exist
# 3. Fall back to default weights if no learned weights available
```

### Custom Weights

```python
# Customize weights explicitly (overrides learned weights)
ensemble = EnsembleScorer(
    embedding_weight=0.7,
    llm_weight=0.3,
    use_learned_weights=False  # Disable learned weights
)
```

### Ranking Multiple Homes

```python
# Rank homes for a user
ranked_homes = ensemble.rank_homes_for_user(
    user_data=user_data,
    homes_data=homes_list,
    top_k=10,
    include_explanations=True
)

for home in ranked_homes:
    print(f"Rank {home['rank']}: {home['home_id']} - Score: {home['final_score']}")
```

### Comparing Scoring Methods

```python
# Compare how different methods rank the same homes
comparison = ensemble.compare_scoring_methods(user_data, homes_data)

print("Correlations:", comparison['correlations'])
print("Embedding rankings:", comparison['rankings']['embedding'])
print("LLM rankings:", comparison['rankings']['llm'])
```

### Training Weights

```python
from app.home_matching.postprocessing.weight_training_job import weight_training_job

# Train weights for a specific user
result = weight_training_job.train_user_weights("user_123", force=False)
print(f"Success: {result['success']}")
print(f"Embedding weight: {result.get('embedding_weight')}")
print(f"LLM weight: {result.get('llm_weight')}")

# Train weights for all eligible users
summary = weight_training_job.train_all_eligible_users(limit=100)
print(f"Trained: {summary['trained']}, Skipped: {summary['skipped']}")
```

## Components

### `blend_scores.py`

Main ensemble scorer implementation:

- **`EnsembleScorer`**: Primary class for ensemble scoring
  - `blend_scores()`: Combines two scores using weighted average
  - `score_user_home_pair()`: Scores a single pair with both methods
  - `rank_homes_for_user()`: Ranks multiple homes concurrently
  - `compare_scoring_methods()`: Compares different scoring approaches
  - `get_ensemble_stats()`: Returns performance statistics

### `batch_scoring.py`

Batch processing utilities:

- **`score_home_batch()`**: Scores a batch of homes concurrently
- **`get_embedding_scores_batch()`**: Gets embedding scores for multiple homes
- **`get_llm_scores_batch()`**: Gets LLM scores for multiple homes

### `comparison.py`

Comparison and analysis tools:

- **`compare_scoring_methods()`**: Compares ranking from different methods
- **`calculate_score_correlations()`**: Calculates correlation coefficients
- **`rank_by_scores()`**: Ranks homes by a specific score field

### `stats.py`

Statistics and performance tracking:

- **`get_ensemble_stats()`**: Generates statistics about ensemble performance
  - Mean, std, min, max for embedding, LLM, and ensemble scores
  - Total predictions tracked
  - Method weights used

### `weight_service.py`

Weight retrieval and management:

- **`WeightService`**: Service for getting weights with cohort fallback
  - `get_weights_for_user()`: Get user or cohort weights
  - `get_or_compute_weights()`: Get existing or train new weights
  - `should_retrain_user()`: Check if user needs retraining

### `weight_learner.py`

Machine learning for weight optimization:

- **`WeightLearner`**: Logistic regression-based weight learner
  - `fit()`: Train model on interaction data
  - `update_user_weights()`: Train and save user weights
  - `update_cohort_weights()`: Train and save cohort weights

### `weight_training_data.py`

Training data extraction:

- **`WeightTrainingDataExtractor`**: Extracts training examples from database
  - `extract_user_training_data()`: Get user's impressions and labels
  - `extract_cohort_training_data()`: Aggregate data for cohort
  - `get_training_data_summary()`: Get statistics about available data

### `weight_training_job.py`

Background training jobs:

- **`WeightTrainingJob`**: Job for periodic weight retraining
  - `train_user_weights()`: Train weights for a specific user
  - `train_cohort_weights()`: Train weights for a cohort
  - `train_all_eligible_users()`: Batch train multiple users

### `cohort_assigner.py`

User cohort assignment:

- **`CohortAssigner`**: Assigns users to cohorts based on characteristics
  - `get_user_cohort()`: Get cohort ID for a user
  - `get_cohort_users()`: Get all users in a cohort
  - Cohorts based on budget, age, location, housing type

## Configuration

Weights are configured in `../config/settings.py`:

- `EMBEDDING_WEIGHT`: Default weight for embedding scores
- `LLM_WEIGHT`: Default weight for LLM scores
- `DEFAULT_TOP_K`: Default number of top results to return

## Weight Learning System

### How It Works

1. **Data Collection**: System tracks user impressions (homes seen) and likes
2. **Training Data**: Extracts embedding/LLM scores and labels (liked=1, not liked=0)
3. **Model Training**: Uses logistic regression to learn optimal blending weights
4. **Weight Storage**: Stores learned weights in `UserScoreWeights` table
5. **Automatic Application**: Learned weights are automatically used when scoring

### Training Requirements

- Minimum 10 impressions per user
- At least 1 positive example (liked home)
- Retraining triggered when:
  - 10+ new impressions since last training
  - 30+ days since last training

### Cohort Fallback

If a user doesn't have enough data or learned weights:

1. System assigns user to a cohort based on demographics/preferences
2. Uses cohort-level learned weights
3. Falls back to default weights if no cohort weights exist

## Error Handling

The ensemble system includes comprehensive error handling:

- Individual method failures don't crash the entire scoring
- Failed scores default to 0.0
- Errors are logged and included in result dictionaries
- Batch processing continues even if individual homes fail
- Weight learning failures fall back to default/cohort weights

## Performance Considerations

- **Concurrency**: Uses thread pools for parallel batch processing
- **Batch Size**: Processes homes in batches of 3 for optimal throughput
- **Caching**: Embedding models are cached and reused
- **Rate Limiting**: LLM calls include retry logic with exponential backoff
- **Database Tracking**: Scoring events are tracked to `ScoringResultsTracker` for analysis

## Output Format

### Single Pair Scoring

```python
{
    'user_id': 'user_123',
    'home_id': 'home_456',
    'scores': {
        'embedding': 0.75,
        'llm': 0.82
    },
    'final_score': 78.5,  # 0-100 scale
    'method_weights': {
        'embedding': 0.5,
        'llm': 0.5
    },
    'llm_explanation': {...}  # If include_explanations=True
}
```

### Ranking Results

```python
[
    {
        'home_data': {...},
        'home_id': 'home_456',
        'scores': {
            'embedding': 0.75,
            'llm': 0.82
        },
        'final_score': 78.5,
        'rank': 1,
        'llm_explanation': {...}  # Optional
    },
    ...
]
```

## Testing

See `blend_scores_test.ipynb` for examples and testing scenarios.
