# Environments, test users, and device matrix

Use this as a **template** for each release or hardening pass. Copy the tables into your test log and fill in real values (never commit secrets).

## Environments

| Environment   | Base URL (web) | API base   | Notes                          |
|---------------|----------------|------------|--------------------------------|
| Staging       | `____________` | `____________` | Should mirror prod email DNS where possible. |
| Production    | `____________` | `____________` | Read-only or smoke-only unless approved.       |

**Native app:** note build number / TestFlight / internal track: `____________`

## Test accounts

**SIL-145 / SIL-126:** committed per-role accounts in [`test-accounts.json`](./test-accounts.json) (production URLs + shared Gmail plus-addressing). Provision once: [provision-test-accounts.md](./provision-test-accounts.md). Verify logins: `./scripts/qa/verify-qa-test-accounts.sh`. Cursor agents: [`.cursor/rules/shared/qa-test-accounts.mdc`](../../../.cursor/rules/shared/qa-test-accounts.mdc).

**Staging / production manual QA** (do not commit secrets):

| Role        | Email / user id        | Password location (e.g. 1Password item) | Purpose                    |
|-------------|------------------------|----------------------------------------|----------------------------|
| New signup  | disposable + alias     | `____________`                          | One-time registration flow |
| Verified user | `____________`      | `____________`                          | Login, dashboard, billing  |
| Admin       | `____________`         | `____________`                          | Admin delete user (staging) |

## Browser and device matrix

Run the **same smoke suite** on each: login (or signup) → one protected action → one API-heavy screen (e.g. search or documents).

### Desktop (five browsers)

| Browser        | Version / channel | OS      | Owner | Pass (Y/N) | Date | Evidence link |
|----------------|-------------------|---------|-------|------------|------|---------------|
| Google Chrome  | `____________`    | macOS/Win |     |            |      |               |
| Safari         | `____________`    | macOS   |     |            |      |               |
| Firefox        | `____________`    | macOS/Win |     |            |      |               |
| Microsoft Edge | `____________`    | macOS/Win |     |            |      |               |

### Mobile (physical devices)

**Do not** use DevTools device emulation for final sign-off of Mobile Safari; use a **real** iPhone or iPad.

| Device   | OS version | Browser            | Network | Pass (Y/N) | Date | Evidence link |
|----------|------------|--------------------|---------|------------|------|---------------|
| iPhone   | `____`     | **Safari (Mobile)**| Wi‑Fi   |            |      |               |
| iPhone   | `____`     | Chrome (iOS)       | Wi‑Fi   |            |      | (optional)    |
| Android  | `____`     | Chrome             | Wi‑Fi   |            |      |               |

**Mobile Safari focus areas (common quirks):** long-lived cookies vs local session, date/time inputs, file upload from Photos/Files, keyboard avoiding on forms, third-party iframes (e.g. maps, payments).

## Automation

- **Web:** no in-repo browser automation; optional `Client/scripts/visual-parity/` uses Chromium for screenshots only (`pnpm parity:web:*` from `Client/`).
- **Native:** use manual checklist in [flow-signup-and-verification.md](./flow-signup-and-verification.md) until a device farm or Detox/Maestro suite exists.
