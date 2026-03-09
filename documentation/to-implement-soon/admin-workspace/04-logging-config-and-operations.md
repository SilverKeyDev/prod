# Admin Workspace: Logging Config & Operations

This document specifies how the admin workspace lets you modify logging-related configuration safely: source of truth, validation, rollout, and how it ties to the existing logger config files without weakening security.

## Goals

- Admins can change what gets logged (categories, level, sampling) without code deploys.
- All changes are validated, versioned, and auditable; bad config cannot be applied.
- The system stays secure: no injection of arbitrary code or exposure of secrets via config.

## Source of truth

Two main approaches, with a recommended path for v1:

### A. Config in repo (v1-friendly)

- **Current state:** `Client/logger/logger.config.json` and `Server/logger/logger_config.json` are the source of truth, read at runtime (client) or at process start (server).
- **Admin workspace (v1):** The workspace can *read* these configs (e.g. via an API that reads from repo or from a copy deployed with the app). Editing can be implemented as:
  - **Option 1:** Admin edits in UI → API writes to a **backing store** (e.g. S3 bucket or database table) that overrides the file-based config when present. At startup, the app loads file first, then applies overrides from the store.
  - **Option 2:** Admin proposes changes (e.g. patch or full JSON); the API creates a branch or MR with the updated file and triggers a review/deploy. The “source of truth” remains the repo; the workspace is the UI for proposing changes.

For v1, **Option 1** (backing store override) gives immediate effect without deploy; Option 2 is better if you want every change to go through git and CI.

### B. Config only in external store

- All config lives in S3, Parameter Store, or a database. Apps fetch config at startup and optionally refresh on an interval.
- Admin workspace reads/writes only this store; no file in repo.
- Requires bootstrap: how do we get the initial config into the store? (e.g. one-time migration from current JSON files.)

**Recommendation for v1:** Start with **A + Option 1**: keep file-based config as default, add an optional override layer (e.g. S3 or DB) that the admin API reads and writes. Document the schema and override precedence clearly so operators know what “effective config” is.

## Schema and validation

- **Schema:** Define a strict JSON schema for client and server logging config (allowed keys, types, and value ranges). Reference the existing structure in:
  - `Client/logger/logger.config.json`
  - `Server/logger/logger_config.json`
- **Validation rules:**
  - Category names must match the known set (e.g. from `LOG_CATEGORIES`).
  - Log level: enum (e.g. DEBUG, INFO, WARN, ERROR).
  - Sampling: number in [0, 1] or per-category object with the same constraint.
  - No extra keys unless the schema explicitly allows them (e.g. `extra` for future use).
- **Admin API:** Before saving, validate payload against the schema; reject with 400 and clear errors if invalid. Optionally support a “dry run” that returns validation result without persisting.

## Rollout and audit

- **Apply:** When an admin clicks “Apply”:
  - Validate config.
  - Persist to the backing store (with version or timestamp).
  - Optionally notify or tag so that running instances can reload (if you implement hot-reload) or so the next deploy picks it up.
- **Audit log:** Every change (who, when, previous value, new value) is logged via the centralized logging utilities (e.g. `log.info(LOG_CATEGORIES.SECURITY, "logging_config_changed", { userId, changeSummary })`). Do not log full config if it might contain sensitive keys; log only change summary or diff.
- **History:** The workspace can show a list of recent changes (from audit log or a dedicated config_history table) and support “Revert to this version” that rewrites the backing store to a previous version.

## Tying to existing logger files

- **Client:** The client today reads `logger.config.json`. To support overrides:
  - Either the build injects a config endpoint and the client fetches overrides at load time, or
  - The client continues to use only the file; overrides apply only to server. (Simpler for v1.)
- **Server:** The server can load config in two steps: (1) load `logger_config.json` from disk; (2) if an override store is configured, fetch and merge (override wins). So the repo file remains the default; the admin workspace only writes overrides.

This way we do not weaken security: we do not allow arbitrary file writes from the admin UI; we only allow writing to a constrained, schema-validated config store that the app is designed to trust.

## Security notes

- The API that reads/writes config must be protected by the same role check as the admin UI (admin-only).
- Do not expose raw config (or diff) in URLs or client-side storage in a way that could leak to non-admins.
- Prefer server-side application of config; avoid sending secrets or internal keys to the client.
