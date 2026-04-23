# End-to-end QA and verification (master runbook)

This is the **execution order** and index for pre-release and hardening. Detailed checklists live in the linked files.

## Execution order (efficient)

1. **Fill** [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) (staging URLs, test accounts, device owners).
2. **Smoke (one browser):** [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) — signup → verify → one dashboard path; run Playwright from `Client/apps/web` for automated smoke.
3. **Repeat smoke** on Chrome, Safari (macOS), Firefox, Edge, then **Mobile Safari on a real device** and Chrome Android.
4. **Errors:** [ERROR_STATES.md](./ERROR_STATES.md) in staging (API down, 5xx, 429) — **manual** or infra-level checks; a blanket “abort all /api” E2E is not used by default.
5. **Email:** [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) for SPF/DKIM/DMARC and provider inbox smokes.
6. **Payments (if live):** [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) with Stripe test cards.
7. **Account deletion:** [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) — process or **admin** staging only until self-serve API ships.
8. **404 / error UI:** [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) + Playwright 404 spec.

## Automation (web)

- Config: `Client/apps/web/playwright.config.ts`
- Tests: `Client/apps/web/e2e/`
- Install browsers once: `pnpm exec playwright install` (from `Client/apps/web` or via `pnpm` from Client root with filter)

```bash
cd Client
pnpm --filter @silverkey/web test:e2e:install   # first-time browser binaries
pnpm --filter @silverkey/web test:e2e
```

`PLAYWRIGHT_BASE_URL` can target staging; default local URL uses the Vite dev port from the config. Omit the variable to let Playwright start the Vite dev server (see `playwright.config.ts`).

## Codebase reality (summary)

- Self-serve **delete account** API is not wired; see [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md).
- **Billing:** confirm with product before full payment E2E; see [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md).
- **In-app 500** is **error boundary** UX, not necessarily `/500`; see [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md).

## Doc index

| Doc | Purpose |
|-----|---------|
| [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) | Environments, accounts, browser/device table |
| [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) | Web + native signup/verify, evidence, Playwright |
| [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) | Stripe / billing when live |
| [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) | Self-serve gap; admin; process |
| [ERROR_STATES.md](./ERROR_STATES.md) | API down, 5xx, 429, payments, auth |
| [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) | Not found, route errors, CDN vs SPA |
| [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) | SPF, DKIM, DMARC, inbox smokes |
