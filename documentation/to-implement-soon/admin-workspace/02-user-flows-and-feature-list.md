# Admin Workspace: User Flows & Feature List

This document captures user stories, main flows, and a feature list for the admin workspace so implementation stays aligned with how you will actually use it.

## User Stories

### Logging configuration

- **As an admin,** I can view the current client and server logging configuration (categories enabled, log level, sampling) so I understand what is being logged today.
- **As an admin,** I can adjust sampling levels or enable/disable categories in the logging config and apply changes safely, so I can get more or less detail without redeploying.
- **As an admin,** I can see a history of config changes and who made them, so I can audit and revert if needed.
- **As an admin,** I can preview or dry-run a config change (e.g. see what would change) before applying it.

### Statistics and analytics

- **As an admin,** I can see top-level KPIs (e.g. activated users, DAU, key feature usage) for a chosen time range, so I can gauge product health at a glance.
- **As an admin,** I can drill into per-feature usage and error rates, so I can prioritize fixes and improvements.
- **As an admin,** I can view funnel completion (e.g. onboarding) and drop-off, so I can decide where to iterate.
- **As an admin,** I can filter or slice metrics by platform (web vs mobile), date range, and optionally tenant, so I can isolate issues or compare segments.

## Main Screens (sketch)

### 1. Logging config

- **Current config view** – Read-only display of effective client and server logging config (e.g. parsed from `logger.config.json` / `logger_config.json` or from the config store).
- **Config editor** – Form-based or JSON-with-guardrails editor:
  - Validation against a schema (allowed keys, value ranges, category names).
  - “Preview” or “diff” showing what would change.
  - “Apply” with optional comment; change is versioned and audit-logged.
- **History** – List of recent changes (who, when, what changed); ability to revert to a previous version.

### 2. Metrics dashboards

- **Overview** – Cards or summary rows for: activated users, DAU/WAU/MAU, top feature usage, overall error rate.
- **Funnels** – One or more funnel views (e.g. onboarding) with step counts and drop-off percentages; filter by date and platform.
- **Feature drill-down** – Table or chart of per-feature usage and error rates; click-through to more detail or to the underlying analytics (e.g. QuickSight or Athena) if needed.
- **Filters** – Global or per-widget: date range, platform (web/mobile), and optionally tenant/segment.

### 3. Security and access

- Access to the admin workspace is gated by route and role; unauthenticated or non-admin users do not see admin routes or data.
- No raw PII in any dashboard; IDs and aggregates only, consistent with the observability privacy doc.

## Feature List (v1)

| Area            | Feature                                      | Priority |
|-----------------|----------------------------------------------|----------|
| Logging config  | View current client/server logging config   | P0       |
| Logging config  | Edit config with validation and apply       | P0       |
| Logging config  | Config change history and revert            | P1       |
| Logging config  | Preview/diff before apply                    | P1       |
| Analytics       | Overview KPIs (activation, DAU, usage)      | P0       |
| Analytics       | Funnel view(s) with filters                 | P0       |
| Analytics       | Per-feature usage and error rates           | P1       |
| Security        | Role-gated access to admin section          | P0       |
| Security        | Audit log for config changes                | P0       |

Future: tenant/segment filters, embedded QuickSight dashboards, feature-flag toggles – to be scoped when needed.
