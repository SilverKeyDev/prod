# Account deletion

## Self-serve (end user, web)

**Shipped:** `POST /api/v1/user/account/delete` with `{ confirm: true }` (rate-limited). Client: `userApi.deleteAccount()` in `Client/packages/features/homeauth/api/user.ts`.

**UI:** Profile → **Privacy & data** (`AccountPrivacyDataSection.web.tsx`) — export JSON, then **Permanently delete account** with a confirmation modal. On success the client logs out and navigates home.

**Native:** `AccountPrivacyDataSection.native.tsx` directs users to the web app for export and deletion (verification and safety).

| Step | What to verify (staging) |
|------|---------------------------|
| Access | Authenticated user only; unauthenticated requests fail. |
| Confirm | Request without `confirm: true` rejected (OpenAPI / server validation). |
| Success | User cannot log in again; related data purged (same purge path as admin delete). |
| UX | Double confirmation in modal; success toast; session cleared. |
| Rate limit | Repeated abuse attempts throttled (server: 3/hour per user). |

**QA approach:** Use a **disposable** test account in staging. Do **not** delete shared QA personas without updating [env-and-device-matrix.md](./env-and-device-matrix.md).

## Admin (staging / authorized operators only)

**Implemented server-side:** `Server/app/routes/admin/handlers/delete_user.py` — deletes a user by id with `confirm: true`, **admin role required**; **cannot** delete self through this handler.

| Step | What to verify (staging) |
|------|---------------------------|
| Access | Non-admin gets **403**. |
| Confirm | Request without `confirm: true` gets **400**. |
| Self-delete | Attempting to delete own account from this endpoint returns **403** (per handler). |
| Success | User and related rows removed; app can no longer log in as that user. |
| UI | `AdminDeleteUserSection` in the client: delete with acknowledged checkbox; errors surfaced (e.g. `HttpError` body). |

## Evidence

- Self-serve / admin: redacted request/response (no PII in public artifacts), or internal ticket reference.
- Process fallback: support ticket ID when users email **privacy@** instead of using in-app delete — see [compliance/data-retention.md](../../policies/data-retention.md).

## Related

- [end-to-end-qa-runbook.md](./end-to-end-qa-runbook.md)
- [flow-signup-and-verification.md](./flow-signup-and-verification.md) — re-registration after deletion (opt-out records may be retained per DATA_RETENTION)
