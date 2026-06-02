# Load testing (k6)

Smoke and baseline scripts for **local or staging** only. Do not run against production without explicit approval.

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed locally
- Backend reachable (e.g. `make dev-backend` or prod-parity compose)

## Scripts

| Script | Purpose |
|--------|---------|
| `smoke.js` | `GET /livez` and `GET /readyz` connectivity |
| `health-db.js` | `GET /healthz` under sustained load |
| `authenticated-read.js` | Public read routes (maps script, public agent profile stub paths) |

## Usage

```bash
# Default base URL: http://127.0.0.1:5000
export LOAD_TEST_BASE_URL=http://127.0.0.1:5000
k6 run scripts/load/smoke.js
k6 run scripts/load/health-db.js
k6 run scripts/load/authenticated-read.js
```

Override VUs and duration:

```bash
k6 run --vus 10 --duration 30s scripts/load/smoke.js
```

## Baseline template (fill after first local run)

Record results from your machine against local dev backend:

| Script | VUs | Duration | p95 (ms) | Error rate | Notes |
|--------|-----|----------|----------|------------|-------|
| smoke.js | 10 | 30s | TBD | TBD | |
| health-db.js | 20 | 60s | TBD | TBD | |
| authenticated-read.js | 10 | 60s | TBD | TBD | |

## Safety

- Never point CI at production URLs without a gated `workflow_dispatch` and ops approval.
- Heavy routes (`forceSearch`, SSE streams) are intentionally excluded from smoke scripts.
