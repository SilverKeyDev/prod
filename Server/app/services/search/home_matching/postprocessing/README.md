# Home matching — ensemble (postprocessing)

Combines **embedding** and **LLM** scores into a final user–home compatibility score (weighted blend; optional per-user/cohort learned weights).

## Components

| Module | Role |
| ------ | ---- |
| `blend_scores.py` | `EnsembleScorer`, weighted blending |
| `batch_scoring.py` | Batch home scoring |
| `weight_service.py` / `weight_learner.py` | Learned weights from impressions/likes |
| `cohort_assigner.py` | Cohort fallback weights |
| `comparison.py` / `stats.py` | Method comparison and metrics |

## Usage (summary)

Configure embedding vs LLM weights (normalized to sum 1). Personalization retrains when enough interaction data exists.

```python
from app.home_matching.postprocessing.blend_scores import EnsembleScorer

ensemble = EnsembleScorer()
final = ensemble.score(user_id, home_id, embedding_score, llm_score)
```

## Related

- [embeddings/README.md](../embeddings/README.md)
- [preprocessing/README.md](../preprocessing/README.md)
