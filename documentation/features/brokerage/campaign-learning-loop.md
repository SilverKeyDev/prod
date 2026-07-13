# Campaign learning loop (SIL-309)

Self-improving A/B email campaigns for the SkySlope brokerage demo — builds on
related tickets below. Demo target: Tue 7/14.

## Related tickets

| Ticket | What SIL-309 reuses |
| ------ | ------------------- |
| **SIL-285** | SkySlope demo org + agent seed |
| **SIL-208** | Celery `heavy` queue + CPU sklearn/torch ML pattern |
| **SIL-306** | DB campaign CRUD (`email_campaigns*`), list/create API |
| **SIL-307** | Results / lift payload + Campaigns UI shell |
| **SIL-308** | Completed A/B seed story (Title vs Home Warranty; B wins Title) |

SIL-309 adds the **closed loop** on top: score → winner → Perplexity review/draft →
persist for dashboard replay. It does **not** replace the DB campaign engine.

## What it does

1. **Scores** seeded campaign recipients (open/click/attach) with a fit-on-request model
2. **Picks a winner** and segment propensities
3. **Reviews** aggregate results via Perplexity (or cached / forced fallback)
4. **Drafts** the next A/B variant pair (`approval_required` — never auto-send)

## Data sources

| Source | Role |
| ------ | ---- |
| DB `email_campaigns*` (SIL-306) + `seed_demo_campaigns.py` | Primary demo campaigns (UUID ids) |
| `Server/data/skyslope-demo/campaigns/campaigns.json` | Offline/unit-test feature matrix (`camp-*` ids) |
| `learning_cache/` + `learning_results/` | Perplexity fallback + persisted one-click output |

Learning loads DB first (events → features; variant CTA/incentive inferred from subject/body).
Stable `camp-*` JSON ids remain for pytest without Postgres.

## Model choice

`CampaignEngagementModel` compares logistic regression, hist gradient boosting, and an optional
CPU torch MLP on holdout AUC. Winner is reported in the payload (demo accuracy > architecture).

## API (added by SIL-309)

| Method | Path |
| ------ | ---- |
| GET | `/api/v1/brokerage/analytics/campaigns/{id}/learning` |
| POST | `/api/v1/brokerage/analytics/campaigns/{id}/learning-loop` |

Existing SIL-306/307 routes unchanged; `GET …/results` now may include `learning` when present.
Optional body on POST: `{"skip_perplexity": true}` for offline demo.

Celery (`heavy`): `tasks.score_campaign_engagement_task`, `tasks.run_campaign_learning_loop_task`.

Brokerage campaign routes follow the same pattern as SIL-306 (Flask + `endpoints.json`;
not yet in OpenAPI).

## Local demo

```bash
# Postgres up
make db-up && make migrate   # if needed
cd Server && .venv/bin/python -m scripts.skyslope.seed_demo_campaigns

# Offline loop (JSON, no auth)
.venv/bin/python scripts/evaluate_sil309.py --run-loop

# Against DB Title Q1 campaign
.venv/bin/python scripts/evaluate_sil309.py --from-db --run-loop
```

UI: Brokerage **Campaigns** page → **Campaign learning loop** panel → Run learning loop /
Offline fallback.

## Acceptance checklist

- [x] One click → winner analysis + what-worked + next draft pair
- [x] Model compares candidates; reports chosen model + AUC
- [x] Perplexity down → cached / forced fallback still drafts
- [x] No auto-send; drafts `pending_approval`
- [x] No PII in Perplexity prompts (aggregates + variant copy)
- [x] Optional Meet CTA stretch via `meet_link.py` (`addGoogleMeet` contract hint)
- [x] Works on SIL-306 DB campaigns + JSON offline path for tests

## Key code

| Layer | Path |
| ----- | ---- |
| Learning package | `Server/app/services/brokerage/campaigns/learning/` |
| DB/JSON bridge | `learning/campaign_loader.py`, `learning_artifacts.py` |
| Routes | `Server/app/routes/brokerage_analytics/__init__.py` |
| Celery | `Server/app/celery/tasks/campaign_learning.py` |
| UI | `Client/.../campaigns/CampaignLearningPanel.tsx` |
| Eval | `Server/scripts/evaluate_sil309.py` |
| Tests | `Server/tests/unit/services/brokerage/test_sil309_campaign_learning.py` |
