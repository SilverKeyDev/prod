# End-to-end QA and verification (master runbook)

This is the **execution order** and index for pre-release and hardening. Detailed checklists live in the linked files.

## Execution order (efficient)

1. **Confirm** [test-accounts.json](./test-accounts.json) is provisioned ([PROVISION_TEST_ACCOUNTS.md](./PROVISION_TEST_ACCOUNTS.md)); run `./scripts/qa/verify-qa-test-accounts.sh`.
2. **Fill** [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) (staging URLs, device owners).
3. **Smoke (one browser):** [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) — signup → verify → one dashboard path (manual checklist).
4. **Repeat smoke** on Chrome, Safari (macOS), Firefox, Edge, then **Mobile Safari on a real device** and Chrome Android.
5. **Errors:** [ERROR_STATES.md](./ERROR_STATES.md) in staging (API down, 5xx, 429) — **manual** or infra-level checks; a blanket “abort all /api” E2E is not used by default.
6. **Email:** [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) for SPF/DKIM/DMARC and provider inbox smokes.
7. **Payments (if live):** [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) with Stripe test cards.
8. **Account deletion:** [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) — process or **admin** staging only until self-serve API ships.
9. **404 / error UI:** [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) — manual checks.

## Automation (web)

There is **no** in-repo Playwright or Cypress E2E suite. Rely on **manual** steps in the flow docs above. Optional **visual parity** screenshots use the `playwright` package’s Chromium launcher from `Client/scripts/visual-parity/` (`pnpm parity:web:record-storage` / `pnpm parity:web:screenshots` from `Client/`); install browsers once with `pnpm exec playwright install chromium` from `Client/` if those scripts fail to launch.

## Codebase reality (summary)

- Self-serve **delete account** API is not wired; see [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md).
- **Billing:** confirm with product before full payment E2E; see [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md).
- **In-app 500** is **error boundary** UX, not necessarily `/500`; see [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md).

## Doc index

| Doc | Purpose |
|-----|---------|
| [test-accounts.json](./test-accounts.json) | Per-role QA credentials (SIL-145) |
| [PROVISION_TEST_ACCOUNTS.md](./PROVISION_TEST_ACCOUNTS.md) | Inbox + signup/seed runbook |
| [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) | Environments, browser/device table |
| [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) | Web + native signup/verify, evidence (manual) |
| [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) | Stripe / billing when live |
| [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) | Self-serve gap; admin; process |
| [ERROR_STATES.md](./ERROR_STATES.md) | API down, 5xx, 429, payments, auth |
| [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) | Not found, route errors, CDN vs SPA |
| [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) | SPF, DKIM, DMARC, inbox smokes |
