# Admin Workspace: Security & Permissions

This document defines security and permission requirements for the admin workspace so that only the right people can access it and all sensitive actions are auditable.

## Access control

- **Who can access:** Only users with an **admin** (or equivalent) role may access the admin workspace. The exact role name can match your existing auth model (e.g. `admin`, `superuser`, or a permission like `admin:workspace`).
- **How it is enforced:**
  - **Frontend:** Admin routes (e.g. `/admin`, `/admin/logging`, `/admin/metrics`) are rendered only if the current user has the admin role; otherwise redirect to a safe page (e.g. home or 403).
  - **Backend:** Every API that serves admin data or performs admin actions (read/write logging config, fetch analytics) must verify the same role. Do not rely on the UI alone; always enforce on the server.
- **No anonymous or end-user access:** The admin workspace is not linked from the main product navigation for non-admins; it is reachable only by URL or internal link and only after auth and role check.

## Audit logging

- **Config changes:** Every change to logging configuration (who, when, what changed – e.g. diff or summary, not necessarily full payload if large) must be logged using the centralized logging utilities:
  - **Client:** Not applicable for config write (server-side only).
  - **Server:** e.g. `log.info(LOG_CATEGORIES.SECURITY, "admin_logging_config_updated", { userId, changeSummary, timestamp })`.
- **Sensitive views:** Optionally log when an admin opens a sensitive view (e.g. metrics that could be used to infer behavior). Prefer a single category (e.g. `ADMIN_ACCESS`) so it can be enabled/disabled for audit without noise.
- **Storage:** Audit logs must be written to the same secure, append-only log stream or store used for other security events; retain according to your compliance and operational needs.

## No raw PII in the workspace

- **Charts and tables** must show only aggregates, counts, and non-PII dimensions (e.g. user IDs or tenant IDs for drill-down, but no emails, names, or free text). This aligns with the user-activity-observability privacy doc.
- **Config and change logs** must not display or log raw secrets or tokens; if config ever contains sensitive keys, mask them in the UI and in audit logs.
- **Error messages** shown in the admin UI must be safe (no stack traces or internal details to non-admin surfaces; for admins, ensure errors are scrubbed via the same PII/security rules).

## Principle of least privilege

- Admin role should be granted only to identities that need to operate the workspace. Prefer a dedicated “admin” role over reusing a broad “developer” role if the latter has more permissions than needed.
- If the workspace later gains distinct capabilities (e.g. “edit config” vs “view metrics”), consider splitting into finer permissions and enforcing them in the API and UI.

## Summary

- Restrict access to the admin workspace and all its APIs to an explicit admin role; enforce on both client and server.
- Log all config changes and optionally sensitive view access through the centralized logger; retain audit logs securely.
- Do not expose raw PII or secrets in the workspace; rely on the same PII-scrubbing and security standards as the rest of the product.
