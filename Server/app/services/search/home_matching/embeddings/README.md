# Home matching — embeddings

Similarity scoring via **text embeddings** (sentence-transformers or OpenAI) plus **structured numerical features**.

## Components

| Module | Role |
| ------ | ---- |
| `scorer.py` | `EmbeddingScorer` — cosine similarity, amplification |
| `user_encoder.py` / `home_encoder.py` | Encode preferences and listings |
| `model_loader.py` | Model load/cache |
| `feature_config.py` | Structured feature extraction config |

## Usage (summary)

Inputs come from [preprocessing/README.md](../preprocessing/README.md) (`EmbeddingUserInput` / `EmbeddingHomeInput` or dicts via `to_dict()`).

```python
from app.home_matching.embeddings.scorer import EmbeddingScorer

scorer = EmbeddingScorer()
score = scorer.get_user_home_similarity(user_dict, home_dict)
```

## Pipeline

1. Preprocess user/home → embedding-ready dicts.
2. Encode text + structured features.
3. Cosine similarity (dimensions must match).

## Related

- [preprocessing/README.md](../preprocessing/README.md)
- [postprocessing/README.md](../postprocessing/README.md) — ensemble blend with LLM scores
