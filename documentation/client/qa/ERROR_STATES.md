# Error states: API down, 5xx, 429, payments

Client HTTP behavior: `Client/packages/services/http/client/HttpClient.ts` (network error logging); **retry** for status codes **429, 502, 503, 504** in `Client/packages/config/http/http.ts`. Map expected UX to **toasts, inline errors, and fallbacks** — not only console logs.

## 1. API unreachable (no TCP / DNS / offline)

| How to simulate | What “good” looks like |
|-------------------|------------------------|
| Block API host in `/etc/hosts` to 0.0.0.0, or airgap laptop, or kill API in a local stack | No **infinite** loading spinners; user sees a **clear** message; critical actions can retry. |
| (Automation) A blanket `page.route('**/api/**', abort)` on first paint is **not** used in the default suite: without stubs, `/healthz` failure can enable maintenance mode, and a full API abort can prevent session bootstrap from finishing. Prefer **manual** checks or targeted stubs. |

## 2. HTTP 5xx from API or proxy

| How to simulate | What “good” looks like |
|-------------------|------------------------|
| Staging test route that returns 500, or temporarily misconfigure origin behind load balancer | Retries per policy; then user-visible error; **no** stack trace or internal IDs to end users. |
| 502/503/504 | Often retried by client; after exhaustion, same as 5xx. |

## 3. Rate limit (429)

| How to simulate | What “good” looks like |
|-------------------|------------------------|
| Rapid scripted requests to a **rate-limited** route (e.g. some DocuSign-related handlers under `Server/app/routes/documents/docusign/`) | Friendly message; if server sends `Retry-After`, consider backing off; no crash. |
| Client | Confirms 429 is in `RETRY_STATUS_CODES` — after retries, user must see failure state. |

## 4. Auth expired

Short session or revoke refresh token: user should be prompted to re-authenticate or redirect to login (`useSecureAuth` / session handling), without corrupting local state more than necessary.

## 5. Payment declined

Use **Stripe test cards** for decline. Expect clear messaging and consistent subscription/entitlement state. See [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md).

## 6. Partial outage (CDN up, API down)

If applicable: static shell may load but data fails — app should not present empty dashboard as if “no data” when the real issue is **network**.

## Checklist (sign off per environment)

- [ ] API down — one critical screen
- [ ] 5xx after retries — one write action (if safe on staging)
- [ ] 429 — one rate-limited surface (if exposed in staging)
- [ ] Payment decline — if Stripe is live
- [ ] Auth expiry — session refresh or re-login

## Related

- [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) — in-app vs CDN errors
- [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md)
