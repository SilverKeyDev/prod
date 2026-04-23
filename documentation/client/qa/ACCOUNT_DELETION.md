# Account deletion

## Self-serve (end user)

`userApi.deleteAccount` in `Client/packages/features/homeauth/api/user.ts` is currently a **stub** that rejects with *Account deletion not available* — there is **no** user-facing delete endpoint wired in the client for production E2E.

**QA approach until an API exists:**

1. **Process-based:** follow [compliance/DATA_RETENTION.md](../../../compliance/DATA_RETENTION.md) — user may request deletion via in-app (when built) or **privacy@** / support email; log ticket ID and 7-day grace if applicable.
2. **Do not** claim “E2E account deletion” for general users in release notes when only admin tooling exists (below).

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

- Admin: redacted request/response (no PII in public artifacts), or internal ticket reference.
- Process: support ticket ID and confirmation email to requester (if applicable).

## Related

- [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md)
- [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) — re-registration after deletion policy (opt-out records may be retained per DATA_RETENTION)
