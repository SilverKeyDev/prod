# Security policy

Security architecture and incident response for SilverKey. **Enforced coding constraints** live in [`.cursor/rules/shared/security.mdc`](../../.cursor/rules/shared/security.mdc) — this doc covers policy, architecture overview, and response procedures.

**Last updated:** 2026-05-28

## Scope

- Authentication (AWS Cognito JWT)
- Token storage (client: memory + sessionStorage — not localStorage)
- PII handling in logs (`packages/logger`, `Server/logger`)
- Input validation (OpenAPI + Pydantic — see [openapi-validation-rollout.md](../guides/openapi-workflow.md))
- File uploads (MIME, size, scanning)
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- OAuth integrations (DocuSign, Google Calendar)

## Authentication

- Primary auth: **AWS Cognito** user pool (`Server/app/services/auth/`).
- JWT verification in `get_current_user` with explicit failure modes — no silent anonymous fallback on protected routes.
- Client tokens: memory + `sessionStorage` only.

## PII and logging

- Mask emails, phones, SSN, cards, JWTs in all logs.
- Use centralized loggers — never raw `console.*` / `print` on production paths.

## File uploads

- Validate MIME type, size limits, malicious patterns; optional virus scan when configured.
- See upload handlers under `Server/app/routes/` and security rule for limits.

## Security headers

Production responses include HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and CSP as configured in deployment. Do not weaken headers in app code.

## OAuth

- DocuSign per-agent OAuth tokens stored server-side; never expose refresh tokens to client.
- State tokens for OAuth CSRF protection on callback routes.

## Rate limiting

- Apply rate limits on auth and sensitive endpoints (see server middleware and route configs).

## Auth cookies, CORS, and production deployment

HTTP-only auth cookies (`session`, `refresh_token`) are set by the API with max-age aligned to [`Server/app/services/auth/utils/cookies.py`](../../Server/app/services/auth/utils/cookies.py). The SPA and API must share a **same-site** deployment model so `credentials: 'include'` requests succeed.

| Check | Detail |
| ----- | ------ |
| **API base URL** | Web/mobile `apiBaseUrl` / `EXPO_PUBLIC_*` must point at the production API host the cookies are issued for (not a mismatched subdomain unless cookie `Domain` is configured for it). |
| **CORS** | `CORS_ALLOWED_ORIGINS` must include every browser origin that loads the SPA (apex **and** `www`, staging hosts, etc.). |
| **Local dev** | Use one hostname consistently (`localhost` **or** `127.0.0.1`) — mixing them splits cookies across hosts and looks like random logouts. |
| **Cross-tab logout** | Client uses `BroadcastChannel`; sibling tabs clear auth with `authReady: true` and redirect to `/login` (see `Client/packages/services/http/client/sessionLogout.ts`). |
| **Refresh without session** | If the short-lived `session` cookie expires but `refresh_token` remains, `/api/v1/auth/refresh-token` can still recover the user (server resolves identity from refresh token). |
| **Transient outages** | Client retries refresh on **503** or `retryable: true` before clearing local auth state. |


## Incident response

1. **Contain** — revoke compromised tokens/credentials; disable affected feature flags if needed.
2. **Assess** — scope via logs (PostHog/server logs with PII masked).
3. **Notify** — follow compliance docs ([compliance/](./)) for breach notification obligations.
4. **Remediate** — patch, rotate secrets via AWS Secrets Manager, document in internal runbook.
5. **Review** — post-incident update to this doc and `.cursor/rules/shared/security.mdc` if constraints change.

## Compliance cross-links

| Doc | Topic |
|-----|-------|
| [privacy-policy.md](./privacy-policy.md) | Privacy |
| [gdpr.md](./gdpr.md) | GDPR |
| [data-retention.md](./data-retention.md) | Retention |

## Implementation detail

For code-level requirements (what agents must never do), use **`.cursor/rules/shared/security.mdc`**. Long historical implementation notes were removed from this file to avoid duplicating the rule.
