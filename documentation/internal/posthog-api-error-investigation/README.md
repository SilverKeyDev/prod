# PostHog API error investigation (internal)

Parallel domain triage for high `api_request` error rates. Parent plan: PostHog API error rate remediation.

| File | Domain |
| ---- | ------ |
| [01-auth.md](./01-auth.md) | `/api/v1/auth/*` |
| [02-oauth.md](./02-oauth.md) | Google/DocuSign OAuth and webhooks |
| [03-agent-research.md](./03-agent-research.md) | Agent, research, task-status |
| [04-admin.md](./04-admin.md) | Admin routes |
| [05-search-integrations.md](./05-search-integrations.md) | Search, Google calendar, transactions |
| [SUMMARY.md](./SUMMARY.md) | Merged prioritized easy wins |

Telemetry reference: [documentation/server/ops/posthog-api-error-semantics.md](../../server/ops/posthog-api-error-semantics.md).
