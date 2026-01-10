# LLM Scorer Module

## Overview

The LLM scorer module uses large language models (LLMs) like OpenAI's GPT models to evaluate user-home compatibility. Unlike embedding-based methods that rely on similarity, LLM scoring provides semantic reasoning and detailed explanations for why a home matches or doesn't match a user's preferences.

## Architecture

The module consists of four main components:

- **`scorer.py`**: Main `LLMScorer` class that orchestrates the scoring pipeline
- **`llm_client.py`**: Handles API communication with LLM providers (OpenAI)
- **`prompt_builder.py`**: Constructs structured prompts for LLM evaluation
- **`parser.py`**: Parses and validates LLM responses, extracting scores and explanations

## Key Features

### Semantic Reasoning

The LLM evaluates homes based on:
- Price vs. budget alignment
- Bedroom/bathroom requirements
- Lot size and square footage needs
- Lifestyle and location preferences
- Amenities and special requirements

### Detailed Explanations

Each score includes:
- **Reasoning**: Detailed explanation of the match assessment
- **Pros**: List of positive aspects
- **Cons**: List of areas where the home falls short
- **Key Factors**: Most important factors in the evaluation

### Scoring Philosophy

The LLM uses a structured scoring system:

- **GREAT (0.8-0.95)**: Home significantly exceeds user preferences
- **GOOD (0.6-0.79)**: Home meets user requirements well
- **FAIR (0.4-0.59)**: Home partially meets requirements
- **POOR (0.1-0.39)**: Home fails to meet key requirements

## Usage

### Basic Scoring

```python
from app.home_matching.llm_scorer.scorer import LLMScorer

# Initialize scorer
scorer = LLMScorer(provider="openai", model="gpt-4")

# Get simple score (0.0-1.0)
score = scorer.llm_score(user_data, home_data)
print(f"Compatibility score: {score:.3f}")
```

### Scoring with Explanation

```python
# Get detailed explanation
result = scorer.llm_score_with_explanation(user_data, home_data)

print(f"Score: {result['score']:.3f}")
print(f"Reasoning: {result['reasoning']}")
print(f"Pros: {result['pros']}")
print(f"Cons: {result['cons']}")
print(f"Key Factors: {result['key_factors']}")
```

### Batch Scoring

```python
# Score multiple homes (faster, scores only)
scores = scorer.batch_score_homes(user_data, homes_data)

# Score with full explanations (slower)
scored_results = scorer.score_user_against_homes(user_data, homes_data)
for home_data, score, explanation in scored_results:
    print(f"Home {home_data['home_id']}: {score:.3f}")
```

### Comparing Multiple Homes

```python
# Get comparison of multiple homes
comparison = scorer.compare_homes_for_user(user_data, homes_data)

print("Rankings:")
for ranking in comparison['rankings']:
    print(f"  {ranking['home_id']}: {ranking['score']:.3f}")

print(f"Best match reasoning: {comparison['best_match_reasoning']}")
```

### Top Matches with Explanations

```python
# Get top-k matches with detailed explanations
top_matches = scorer.get_top_matches_with_explanations(
    user_data, 
    homes_data, 
    top_k=5
)

for match in top_matches:
    print(f"Rank {match['rank']}: {match['home_id']}")
    print(f"  Score: {match['score']:.3f}")
    print(f"  Reasoning: {match['explanation']['reasoning']}")
```

## Components

### `scorer.py`

Main scoring interface:

- **`LLMScorer`**: Primary class for LLM-based scoring
  - `llm_score()`: Get simple compatibility score
  - `llm_score_with_explanation()`: Get score with detailed explanation
  - `score_user_against_homes()`: Score multiple homes with explanations
  - `batch_score_homes()`: Fast batch scoring (scores only)
  - `compare_homes_for_user()`: Compare and rank multiple homes
  - `get_top_matches_with_explanations()`: Get top-k with explanations
  - `explain_existing_score()`: Explain a pre-computed score

### `llm_client.py`

LLM API communication:

- **`LLMClient`**: Handles API calls to LLM providers
  - `call_llm()`: Make LLM API call with retry logic
  - Automatic retry with exponential backoff
  - Rate limit handling with retry-after parsing
  - JSON response format support
  - Token usage tracking

**Features:**
- Retry logic for rate limits and API errors
- Automatic JSON parsing with fallback extraction
- Token usage tracking
- Configurable temperature and max tokens

### `prompt_builder.py`

Prompt construction:

- **`PromptBuilder`**: Builds structured prompts for LLM evaluation
  - `build_user_prompt()`: Creates prompt for single home scoring
  - `build_comparison_prompt()`: Creates prompt for comparing multiple homes
  - `build_explanation_prompt()`: Creates prompt for explaining existing scores
  - `get_system_prompt()`: Returns system instructions
  - `validate_prompt_length()`: Checks prompt size limits

**Prompt Structure:**
- System prompt with scoring philosophy and guidelines
- User preferences section (budget, bedrooms, bathrooms, lifestyle, etc.)
- Home details section (price, size, amenities, location, etc.)
- Structured JSON response format

### `parser.py`

Response parsing and validation:

- **`LLMResponseParser`**: Parses and validates LLM responses
  - `parse_scoring_response()`: Parse single home scoring response
  - `parse_comparison_response()`: Parse multi-home comparison response
  - `parse_explanation_response()`: Parse score explanation response
  - `validate_response_completeness()`: Check response quality
  - `extract_scores_from_batch()`: Extract scores from batch responses

**Features:**
- Handles JSON and text responses
- Automatic JSON extraction from text
- Structured text parsing fallback
- Field validation and normalization
- Error response generation

## Configuration

LLM settings are configured in `../config/settings.py`:

- `OPENAI_KEY`: OpenAI API key
- `LLM_MODEL`: Default LLM model (e.g., "gpt-4")
- `LLM_TEMPERATURE`: Temperature for response generation
- `LLM_MAX_TOKENS`: Maximum tokens in response

## Error Handling

Comprehensive error handling throughout:

- **API Errors**: Retry with exponential backoff
- **Rate Limits**: Automatic retry with parsed wait times
- **Parsing Errors**: Fallback to text extraction
- **Invalid Responses**: Default to safe error responses
- **Prompt Length**: Automatic truncation with warnings

## Response Format

### Scoring Response

```python
{
    'score': 0.82,  # 0.0-1.0
    'reasoning': 'This home exceeds the user's requirements...',
    'pros': [
        'Price well within budget',
        'More bedrooms than requested',
        'Excellent location'
    ],
    'cons': [
        'Slightly smaller lot than preferred'
    ],
    'key_factors': [
        'Price value',
        'Size adequacy',
        'Location quality'
    ],
    'metadata': {
        'usage': {
            'prompt_tokens': 450,
            'completion_tokens': 120,
            'total_tokens': 570
        },
        'model': 'gpt-4',
        'finish_reason': 'stop'
    }
}
```

### Comparison Response

```python
{
    'rankings': [
        {
            'home_id': 'home_123',
            'score': 0.85,
            'brief_reasoning': 'Best match due to...'
        },
        ...
    ],
    'overall_analysis': 'Summary of comparison...',
    'best_match_reasoning': 'Why the top choice is best...',
    'considerations': [
        'Factor 1 to consider',
        'Factor 2 to consider'
    ]
}
```

## Performance Considerations

- **Batch Processing**: Processes homes sequentially (LLM APIs don't support true batching)
- **Prompt Optimization**: Truncates long prompts to stay within token limits
- **Caching**: System prompts are built once and reused
- **Rate Limiting**: Automatic retry with exponential backoff
- **Token Usage**: Tracks and logs token consumption

## Limitations

- **API Costs**: Each scoring call incurs API costs
- **Latency**: LLM calls are slower than embedding-based methods
- **Rate Limits**: Subject to API rate limits
- **Prompt Length**: Limited by model context windows
- **Consistency**: LLM responses may vary slightly between calls

## Testing

See `test_llm_scorer.ipynb` for comprehensive testing examples and scenarios.
