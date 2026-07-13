# Campaign demo seed (SIL-308 / SIL-309)

File-backed A/B campaign store used by the brokerage analytics learning loop.

| File / dir | Purpose |
| ---------- | ------- |
| `campaigns.json` | Two completed campaigns (Title Q1, Warranty Q2) with variants + recipients |
| `learning_cache/` | Cached Perplexity draft/review fallbacks (demo-safe if API down) |
| `learning_results/` | Persisted one-click learning-loop outputs |

Regenerate seed (from `Server/` with venv):

```bash
python scripts/skyslope/seed_campaign_demo.py --arms 80
python scripts/evaluate_sil309.py --run-loop
```

No Alembic migration — JSON store for Tuesday demo; DB tables can land with SIL-306 proper.
