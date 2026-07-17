# Campaign learning loop (SIL-309)

**Status:** demo-only · **Last verified:** 2026-07-17

The brokerage Campaigns page combines a client-side campaign editor with an API-backed learning
panel. They share a page, but they are not one persistence flow: editing a category or variant does
not update the campaigns scored by the learning panel. SIL-309 adds scoring, aggregate review, and
approval-required draft suggestions on top of the SIL-306 campaign API.

## Page architecture

| Surface | Source of truth | Persistence and side effects |
| ------- | --------------- | ---------------------------- |
| Category sections, settings, variants, projections, email preview | `CAMPAIGN_CATEGORIES_FIXTURE` through `useCampaignCategories()` | React state only; changes reset on reload and do not call the campaign API |
| Campaign learning panel | SIL-306/307/309 routes through `campaignAnalyticsApi` | Reads DB campaigns and writes learning artifacts to the local filesystem |
| `POST /brokerage/analytics/campaigns` | SQLAlchemy campaign service | Creates DB records; `send=true` records sent state, but SES delivery is stubbed and only logged |

The learning panel does not consume the category fixture state. A draft produced by the learning
loop appears in the panel only; it is not inserted into the editable category sections and is never
sent automatically.

## Learning workflow

1. Load a brokerage-scoped campaign. `camp-*` IDs use the JSON store; all other IDs use Postgres.
2. Build recipient rows from campaign events and compare logistic regression, histogram gradient
   boosting, and, when installed, a small CPU torch MLP.
3. Reject datasets with fewer than 20 rows or only one outcome class.
4. Pick the model by holdout AUC, then accuracy, then the simpler-model tie-break order.
5. Send aggregate metrics and variant copy to Perplexity, or use cached/generated fallback content.
6. Mark the proposed variants `pending_approval` and persist the full result for replay.

For DB campaigns, CTA and incentive metadata are inferred from subject/body text. Agent tenure,
volume, prior engagement, and office values are deterministic synthetic features because the
campaign ORM does not contain those fields.

## Data and artifact lifecycle

| Source | Role |
| ------ | ---- |
| DB `email_campaigns*` + `scripts.skyslope.seed_demo_campaigns` | Campaign list used by the UI (`UUID` IDs) |
| `data/skyslope-demo/campaigns/campaigns.json` | Offline CLI/test matrix (`camp-*` IDs); not listed in the UI |
| `data/skyslope-demo/campaigns/learning_cache/` | Last Perplexity review/draft or generated fallback |
| `data/skyslope-demo/campaigns/learning_results/` | Last complete learning result, one JSON file per campaign ID |

Learning artifacts are not stored in Postgres. They disappear if the runtime filesystem is replaced
or the data directory is cleared. JSON campaigns are returned only when the request's
`brokerage_org_id` matches the org in `campaigns.json`.

## HTTP interface

Every route requires authentication, a non-empty `user.brokerage_org_ids`, and a
`brokerage_org_id` query parameter that belongs to that user.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/v1/brokerage/analytics/campaigns` | List DB campaigns for the org |
| `GET` | `/api/v1/brokerage/analytics/campaigns/{id}/results` | Return funnel, lift, recovered dollars, and saved learning when present |
| `GET` | `/api/v1/brokerage/analytics/campaigns/{id}/learning` | Return the last saved learning result or `learning: null` |
| `POST` | `/api/v1/brokerage/analytics/campaigns/{id}/learning-loop` | Run scoring, review, draft, and persistence synchronously |

The learning-loop body is optional:

```json
{ "skip_perplexity": true }
```

`skip_perplexity: true` forces generated fallback review and draft content. Otherwise a missing key,
timeout, non-JSON response, or upstream error falls back to cached content and then generated
content. The Perplexity request timeout is 45 seconds, and the HTTP route waits for the complete
loop. Celery tasks exist on the `heavy` queue as alternate entry points, but the UI and HTTP handler
do not enqueue them.

These Flask routes are registered in `Server/endpoints.json` but are not represented in `openapi/`
as of the verification date. Do not hand-edit generated client types for them.

## Local validation

The JSON path validates scoring and fallback drafting without a running Postgres service, API auth,
or Perplexity. It still imports server configuration, so provide the test-mode SQLite URL:

```bash
cd Server
TESTING=true DATABASE_URL='sqlite:///:memory:' \
  .venv/bin/python scripts/evaluate_sil309.py --run-loop
```

For the DB path, start Postgres in an environment where repository migrations are already applied,
seed the demo campaigns, and run the same loop against the seeded Title campaign:

```bash
make db-up
cd Server
.venv/bin/python -m scripts.skyslope.seed_demo_campaigns
.venv/bin/python scripts/evaluate_sil309.py --from-db --run-loop
```

For the UI path:

1. Use a brokerage account whose `brokerage_org_ids` includes the demo org. See
   [Provision QA test accounts](../../runbooks/qa/provision-test-accounts.md).
2. Open the brokerage **Campaigns** page.
3. In **Campaign learning loop**, select a seeded DB campaign.
4. Use **Run learning loop** for Perplexity-with-fallback or **Offline fallback** to force local
   fallback content.
5. Confirm the winner, source, and next-iteration draft appear and the draft remains
   `pending_approval`.

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| No seeded campaigns / list request fails | Confirm DB seed data, authentication, and that the user's `brokerage_org_ids` contains the requested org |
| `400 brokerage_org_id is required` | Include `?brokerage_org_id={id}`; client helpers add it automatically |
| `403 Brokerage access is not configured` | Attach brokerage org membership to the account; the client demo-org fallback does not bypass server authorization |
| `403 Forbidden for this brokerage organization` | The requested org is outside the authenticated user's allowed list |
| `404 Campaign not found` | Confirm campaign ID and org; `camp-*` IDs must also match the JSON store org |
| `500 db_unavailable` or failed campaign load | Start Postgres and confirm the environment has existing migrations applied |
| `500 insufficient_rows` | Use a campaign with at least 20 recipient feature rows |
| `500 single_class_labels` | Seed both positive and negative outcomes for the model's attach target |
| Perplexity is unavailable | Use **Offline fallback** or inspect `learning_cache/`; drafts remain approval-required |
| Saved learning vanished after restart/deploy | Check `learning_results/`; results use local files, not Postgres |

## Guardrails

- Perplexity receives aggregate statistics and variant copy, not agent IDs, names, email addresses,
  phone numbers, or addresses.
- Drafts always set `approval_required: true`, `status: pending_approval`, and `auto_send: false`.
- The feature is CPU-only. Torch is optional; sklearn candidates remain available without it.
- Campaign creation's SES path is stubbed for the demo; UI category edits have no server side effect.

## Key code and tests

| Layer | Path |
| ----- | ---- |
| Page composition | `Client/packages/features/brokerage/components/campaigns/BrokerageCampaignsShell.tsx` |
| Client-only editor state | `Client/packages/features/brokerage/hooks/useCampaigns.ts` |
| Learning UI and API hooks | `Client/packages/features/brokerage/components/campaigns/CampaignLearningPanel.tsx`, `hooks/useCampaignLearning.ts` |
| HTTP client | `Client/packages/features/brokerage/api/campaignAnalytics.ts` |
| Routes | `Server/app/routes/brokerage_analytics/__init__.py` |
| Campaign CRUD | `Server/app/services/brokerage/campaigns/service.py` |
| Learning package | `Server/app/services/brokerage/campaigns/learning/` |
| DB/JSON bridge and artifacts | `learning/campaign_loader.py`, `campaigns/learning_artifacts.py` |
| Optional Celery entry points | `Server/app/celery/tasks/campaign_learning.py` |
| CLI validation | `Server/scripts/evaluate_sil309.py` |
| Tests | `Server/tests/unit/services/brokerage/test_sil309_campaign_learning.py`, `Server/tests/unit/routes/brokerage_analytics/test_campaigns.py`, `Client/packages/features/brokerage/components/campaigns/CampaignLearningPanel.test.tsx` |
