# End-to-end QA and verification (master runbook)

This is the **execution order** and index for pre-release and hardening. Detailed checklists live in the linked files.

## Execution order (efficient)

1. **Fill** [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) (staging URLs, test accounts, device owners).
2. **Smoke (one browser):** [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) — signup → verify → one dashboard path (manual checklist).
3. **Repeat smoke** on Chrome, Safari (macOS), Firefox, Edge, then **Mobile Safari on a real device** and Chrome Android.
4. **Errors:** [ERROR_STATES.md](./ERROR_STATES.md) in staging (API down, 5xx, 429) — **manual** or infra-level checks; a blanket “abort all /api” E2E is not used by default.
5. **Email:** [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) for SPF/DKIM/DMARC and provider inbox smokes.
6. **Payments (if live):** [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) with Stripe test cards.
7. **Account deletion:** [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) — self-serve on **web** (disposable staging account); admin path for operators.
8. **404 / error UI:** [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) — manual checks.
9. **Accessibility (WCAG 2.1 AA):** [ACCESSIBILITY_CHECKLIST.md](./ACCESSIBILITY_CHECKLIST.md) — keyboard, screen reader, zoom; run jest-axe + optional Playwright axe script.

## Automation (web)

There is **no** in-repo Playwright or Cypress E2E suite. Rely on **manual** steps in the flow docs above. Optional **visual parity** screenshots use the `playwright` package’s Chromium launcher from `Client/scripts/visual-parity/` (`pnpm parity:web:record-storage` / `pnpm parity:web:screenshots` from `Client/`); install browsers once with `pnpm exec playwright install chromium` from `Client/` if those scripts fail to launch.

## Codebase reality (summary)

- Self-serve **delete account** is wired on **web** (`POST /api/v1/user/account/delete`); native defers to web — see [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md).
- **Billing:** confirm with product before full payment E2E; see [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md).
- **In-app 500** is **error boundary** UX, not necessarily `/500`; see [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md).

## Engineering gates (before merge)

From repo root: `make check-client` (typecheck, lint, format, cycles, audit, web build) and `make check-docs`. See [AGENTS.md](../../../AGENTS.md).

## Doc index

| Doc | Purpose |
|-----|---------|
| [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) | Environments, accounts, browser/device table |
| [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) | Web + native signup/verify, evidence (manual) |
| [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) | Stripe / billing when live |
| [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) | Web self-serve delete; admin; support fallback |
| [ERROR_STATES.md](./ERROR_STATES.md) | API down, 5xx, 429, payments, auth |
| [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) | Not found, route errors, CDN vs SPA |
| [ACCESSIBILITY_CHECKLIST.md](./ACCESSIBILITY_CHECKLIST.md) | WCAG 2.1 AA keyboard, screen reader, zoom, automated axe |
| [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) | SPF, DKIM, DMARC, inbox smokes |
