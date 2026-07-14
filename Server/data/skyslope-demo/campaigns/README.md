# Campaign demo data (SIL-308 / SIL-309)

| Path | Purpose |
| ---- | ------- |
| DB via `scripts.skyslope.seed_demo_campaigns` | Primary SIL-308 seed into `email_campaigns*` |
| `campaigns.json` | Optional SIL-309 JSON feature matrix (`camp-*`) for offline ML/tests |
| `learning_cache/` | Cached Perplexity draft/review fallbacks |
| `learning_results/` | Persisted one-click learning-loop outputs |

```bash
cd Server
.venv/bin/python -m scripts.skyslope.seed_demo_campaigns
.venv/bin/python scripts/evaluate_sil309.py --run-loop
.venv/bin/python scripts/evaluate_sil309.py --from-db --run-loop
```
