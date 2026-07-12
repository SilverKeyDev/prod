# End-to-end QA and verification (master runbook)

This is the **execution order** and index for pre-release and hardening. Detailed checklists live in the linked files.

## Execution order (efficient)

1. **Confirm** [test-accounts.json](./test-accounts.json) is provisioned ([provision-test-accounts.md](./provision-test-accounts.md)); run `./scripts/qa/verify-qa-test-accounts.sh`.
2. **Fill** [env-and-device-matrix.md](./env-and-device-matrix.md) (staging URLs, test accounts, device owners).
3. **Smoke (one browser):** [flow-signup-and-verification.md](./flow-signup-and-verification.md) — signup → verify → one dashboard path (manual checklist).
4. **Repeat smoke** on Chrome, Safari (macOS), Firefox, Edge, then **Mobile Safari on a real device** and Chrome Android.
5. **Errors:** [error-states.md](./error-states.md) in staging (API down, 5xx, 429) — **manual** or infra-level checks; a blanket “abort all /api” E2E is not used by default.
6. **Email:** [email-deliverability.md](./email-deliverability.md) for SPF/DKIM/DMARC and provider inbox smokes.
7. **Payments (if live):** [flow-payments.md](./flow-payments.md) with Stripe test cards.
8. **Account deletion:** [account-deletion.md](./account-deletion.md) — self-serve on **web** (disposable staging account); admin path for operators.
9. **404 / error UI:** [error-pages-404-500.md](./error-pages-404-500.md) — manual checks.
10. **Accessibility (WCAG 2.1 AA):** [accessibility-checklist.md](./accessibility-checklist.md) — keyboard, screen reader, zoom; run jest-axe + optional Playwright axe script.

## Automation (web)

There is **no** in-repo Playwright or Cypress E2E suite. Rely on **manual** steps in the flow docs above. Optional **visual parity** screenshots use the `playwright` package’s Chromium launcher from `Client/scripts/visual-parity/` (`pnpm parity:web:record-storage` / `pnpm parity:web:screenshots` from `Client/`); install browsers once with `pnpm exec playwright install chromium` from `Client/` if those scripts fail to launch.

## Codebase reality (summary)

- Self-serve **delete account** is wired on **web** (`POST /api/v1/user/account/delete`); native defers to web — see [account-deletion.md](./account-deletion.md).
- **Billing:** confirm with product before full payment E2E; see [flow-payments.md](./flow-payments.md).
- **In-app 500** is **error boundary** UX, not necessarily `/500`; see [error-pages-404-500.md](./error-pages-404-500.md).

## Engineering gates (before merge)

From repo root: `make check-client` (typecheck, lint, format, cycles, audit, web build) and `make check-docs`. See [AGENTS.md](../../../AGENTS.md).

## Doc index

| Doc | Purpose |
|-----|---------|
| [test-accounts.json](./test-accounts.json) | Per-role QA credentials (SIL-145) |
| [provision-test-accounts.md](./provision-test-accounts.md) | Inbox + signup/seed runbook |
| [env-and-device-matrix.md](./env-and-device-matrix.md) | Environments, browser/device table |
| [flow-signup-and-verification.md](./flow-signup-and-verification.md) | Web + native signup/verify, evidence (manual) |
| [flow-payments.md](./flow-payments.md) | Stripe / billing when live |
| [account-deletion.md](./account-deletion.md) | Web self-serve delete; admin; support fallback |
| [error-states.md](./error-states.md) | API down, 5xx, 429, payments, auth |
| [error-pages-404-500.md](./error-pages-404-500.md) | Not found, route errors, CDN vs SPA |
| [accessibility-checklist.md](./accessibility-checklist.md) | WCAG 2.1 AA keyboard, screen reader, zoom, automated axe |
| [email-deliverability.md](./email-deliverability.md) | SPF, DKIM, DMARC, inbox smokes |
