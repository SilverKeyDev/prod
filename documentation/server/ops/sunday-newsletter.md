# Sunday newsletter email workflow

> **Last verified:** 2026-06-05 against `.github/workflows/sunday_newsletter*.yml` and `Server/app/services/email/*`.

The Sunday newsletter workflow refreshes buyer property matches, renders a listings email, and sends it through AWS SES. It is implemented as GitHub Actions orchestration around the backend email services, not as a long-running server process or Celery beat task. Keep this runbook in sync whenever the workflow inputs, Secrets Manager loading, SES sender, or email template handoff changes.

## Codepaths

| Area | Location |
|------|----------|
| Scheduled production workflow | `.github/workflows/sunday_newsletter.yml` |
| Single-recipient test workflow | `.github/workflows/sunday_newsletter_test.yml` |
| Email orchestration entrypoint | `Server/app/services/email/run_email_listings.py` |
| Polygon refresh for eligible users | `Server/app/services/email/run_polygon_for_all_users.py` |
| Eligible-user query | `Server/app/services/email/last_logged_in.py` |
| Text/HTML message formatting | `Server/app/services/email/format_email_content.py` |
| React Email render bridge | `Server/app/services/email/render_email_html.py` |
| React Email CLI renderer | `Client/packages/email-templates/render-email.ts` |
| SES send helper | `Server/app/services/email/send_test_emails_via_ses.py` |

## Schedule and variants

- Both workflows are scheduled for `0 11 * * 0` (Sunday 11:00 UTC / 6:00 Eastern as currently commented in YAML) and support `workflow_dispatch`.
- `sunday_newsletter.yml` sends to every eligible user with current listings.
- `sunday_newsletter_test.yml` sets `TEST_EMAIL` in the workflow env so the same orchestrator only sends to a single matching user. Update that workflow value when changing the test recipient; do not add a new env key for this.
- Concurrency groups are separate (`email-listings` and `email-listings-test`) and cancel in-progress runs to avoid overlapping sends.

## Runtime flow

1. GitHub Actions checks out the repo and frees runner disk by removing preinstalled SDKs that are not used by this workflow.
2. AWS credentials are configured from GitHub repository secrets, then app runtime values are loaded from AWS Secrets Manager (`db_url`, `AWS_Access`, `cognito`, `gmaps`, `google_calendar`, `census_api`, `mapbox`, `openai`, `perplexity`, `plaid`, `serp`, `slipstream`).
3. Python 3.11, pnpm 9, Node 20, server dependencies, CPU-only `torch==2.10.0`, and client dependencies are installed.
4. `python Server/app/services/email/run_email_listings.py` runs with `PYTHONPATH=Server`, `AWS_REGION=us-east-2`, and the workflow knobs below.
5. The orchestrator first calls `run_polygon_search_for_all_users_with_context()` to force-refresh `/api/v1/search/properties-by-polygon` for users with preferences.
6. It then builds emails for users who logged in within the last 30 days and have `has_preferences = true`.
7. Emails include the top current `UserPropertyLink` rows ordered by score (nulls last) and `updated_at`, joined to `PropertyCache`.
8. HTML rendering is attempted through the React Email TypeScript renderer; failures fall back to text-only email bodies.
9. SES sends from `noreply@usesilverkey.com` in `AWS_REGION` / `AWS_DEFAULT_REGION`.

## Operator knobs

These are read by `run_email_listings.py` unless noted.

| Variable | Default in code | Workflow value | Purpose |
|----------|-----------------|----------------|---------|
| `POLY_SEARCH_PAUSE_SECONDS` | `1.0` | `5.0` | Delay between users while refreshing polygon searches. |
| `POLY_SEARCH_PER_BUCKET_PAGES` | `5` | `5` | Pages per bucket sent to `/properties-by-polygon`; capped to 20 in `run_polygon_for_all_users.py`. |
| `POLY_SEARCH_USER_LIMIT` | unset | unset | Optional integer cap for ad hoc/testing runs. |
| `POLY_SEARCH_ONLY_RECENT` | `true` in `run_polygon_for_all_users.py` CLI | not passed by newsletter orchestrator | Only applies when running `run_polygon_for_all_users.py` directly. |
| `EMAIL_MAX_ITEMS_PER_USER` | `10` | `10` | Max listings rendered per recipient. |
| `EMAIL_USE_HTML` | `true` | `true` | Attempt React Email rendering; text body is always produced. |
| `TEST_EMAIL` | unset | set only in test workflow | Filters recipients to one email; direct lookup is allowed if the user has preferences. |
| `DRY_RUN` | `false` | unset | Logs a preview instead of sending through SES. |
| `FAIL_ON_EMPTY` | `false` | unset | Exits with status 2 if no eligible messages are produced. |

## Manual validation

Use the test workflow for production-connected validation when possible. For local or one-off CI debugging, run from the repo root with a real server env, installed client dependencies, and a non-empty `DATABASE_URL`:

```bash
PYTHONPATH=Server \
AWS_REGION=us-east-2 \
DRY_RUN=true \
TEST_EMAIL=user@example.com \
EMAIL_MAX_ITEMS_PER_USER=3 \
python Server/app/services/email/run_email_listings.py
```

Expected dry-run behavior:

- The polygon refresh may log individual user failures but the orchestrator continues to email generation.
- If the user is eligible and has current listings, logs include a `[DRY_RUN] Would send ... emails` preview and no SES call is made.
- If no messages are built, the process exits successfully unless `FAIL_ON_EMPTY=true`.

## Common failures

| Symptom | Likely cause | Check |
|---------|--------------|-------|
| `DATABASE_URL` missing or invalid | Secrets Manager `db_url` did not export a usable connection string | Workflow step **Load app env from AWS Secrets Manager**; secret can be plaintext, a JSON string, or a JSON object with `DATABASE_URL`, `database_url`, `db_url`, `url`, `connection_string`, `connectionString`, `uri`, or `URI`. |
| Runner disk pressure during dependency install | Cached or CUDA-heavy wheels fill the runner | Keep the disk cleanup step and CPU-only torch install before `Server/requirements/runtime.txt`. |
| HTML render script missing | Client package tree or install step is unavailable | Workflow checks `Client/packages/email-templates/render-email.ts`; renderer then looks for `tsx` under `Client/apps/web/node_modules/.bin` or falls back to `npx` / `pnpm exec`. |
| HTML rendering fails but text emails send | React Email render error or timeout | `format_email_content.py` catches render failures and logs a text-only fallback. |
| SES send fails | Missing AWS region/permissions, sender/domain verification, or SES throttling | `send_test_emails_via_ses.py` requires `AWS_REGION` or `AWS_DEFAULT_REGION`; inspect the `SES send failed` log and AWS SES console. |
| No recipients | No users logged in within 30 days with preferences, no current listings, or `TEST_EMAIL` does not match an eligible user | Check `last_logged_in.py`, `User.has_preferences`, and `UserPropertyLink.current`. Use `FAIL_ON_EMPTY=true` only when emptiness should fail the run. |

## Change checklist

- Keep workflow env names aligned with the operator knobs above.
- Do not add new `.env.example` keys for newsletter-only tuning; use workflow env or existing Secrets Manager values.
- If changing the email template contract, update both `Client/packages/email-templates/render-email.ts` and `Server/app/services/email/render_email_html.py`.
- If changing recipient eligibility, update `last_logged_in.py` and this runbook together.
- If changing SES sender behavior, verify domain/sender configuration in AWS SES and update this runbook.
