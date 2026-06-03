# Admin Workspace: Logging Config & Operations

Admin **Logging** (`/admin/logging`) lets admins tune logger category toggles for personal debugging. Source of truth for category names is [`scripts/log_contracts/categories.yaml`](../../../scripts/log_contracts/categories.yaml); run `make log-contracts` after edits.

## Runtime behavior

| Scope | Storage | Who it affects |
| ----- | ------- | -------------- |
| **Client** | `deployment_logger_config.config.client` JSON | Only the admin’s **current browser tab** while the Logging page is open (`log.updateConfig`). Not loaded app-wide for end users. |
| **Server** | `deployment_logger_config.config.server` JSON | The running Flask API process (immediate `log.update_config` + reload on startup). |

API: `GET` / `POST` `/api/v1/admin/logger-config`. POST accepts **partial** patches (`ClientLoggerConfigPatch` / `ServerLoggerConfigPatch`) merged by [`deployment_logger_config.merge_and_persist`](../../../Server/app/services/admin/deployment_logger_config.py).

## Modern logging

- Call sites use dot-notation log paths (`log.info("SEARCH", ...)`).
- `ERRORS` and `SECURITY` are always enabled.
- OpenAPI logger schemas are generated from `categories.yaml` (see `make log-contracts`).

## Security

- Admin role required (`user_has_admin_role`).
- Changes are audit-logged via `log.security` on the server; do not log full config blobs if they may contain sensitive keys.
