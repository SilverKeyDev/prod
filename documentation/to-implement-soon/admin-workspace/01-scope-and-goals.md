# Admin Workspace: Scope & Goals

This document defines the scope and goals for the **admin workspace** at SilverKey: an internal control plane where you manage logging configuration, view statistics, and operate analytics derived from user activity observability.

## Purpose

The admin workspace is the single place where you:

- **Control logging** – Enable, disable, or tune logging categories and sampling via JSON-based configuration, without code deploys.
- **View statistics and insights** – See key metrics, funnels, and drill-downs from the user activity observability layer.
- **Operate with safety** – All changes are validated, audited, and reversible; access is restricted to authorized roles.

Future extensions may include: toggling feature flags, managing tenants, or other operational actions. Those are out of scope for the initial version and can be designed later.

## Primary Users

- **You (product/engineering owner)** – Primary user: adjust logging for debugging or iteration, review metrics to prioritize work.
- **Other admins** – Same capabilities, with access controlled by role.
- **Support (optional later)** – Read-only access to aggregated metrics or safe drill-downs to help diagnose user-reported issues, without raw config edit rights.

For v1, the workspace is aimed at a small set of internal admins; no external or customer-facing admin UI is required.

## Goals

1. **Logging config as data** – Change logging behavior (categories on/off, sampling, log level) by editing configuration that is validated, versioned, and applied consistently across client and server.
2. **Single pane for key metrics** – Surface the metrics defined in the user-activity-observability docs (activation, funnels, feature adoption, errors, latency) so you can make iteration choices from evidence.
3. **Security and audit** – Only designated roles can access the workspace; all config changes and sensitive views are logged via the centralized logging utilities; no raw PII in the UI.

## Non-Goals (v1)

- Full DevOps/infra control (e.g. scaling, deployments) – that stays in existing CI/CD and cloud consoles.
- Customer self-service admin – this is an internal tool only.
- Replacing specialized tools (e.g. AWS QuickSight, CloudWatch) entirely – the workspace can embed or link to them where that is the right trade-off.
