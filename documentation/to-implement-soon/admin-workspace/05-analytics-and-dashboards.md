# Admin Workspace: Analytics & Dashboards

This document describes how the metrics defined in the user-activity-observability docs surface in the admin workspace: rendering approach, filters, and access/performance considerations.

## Metrics to surface

The observability doc **04-metrics-and-insights.md** defines:

- Acquisition & activation (e.g. activated users, onboarding funnel).
- Engagement & feature adoption (feature usage, DAU/WAU/MAU).
- Retention (e.g. N-day retention cohorts).
- Reliability & performance (error rate per feature, latency profiles).

The admin workspace should expose these in a way that supports:

- **Glanceable overview** – Top-level KPIs for a chosen time range.
- **Drill-down** – By feature, platform (web/mobile), and optionally tenant or segment.
- **Consistency** – Same definitions and calculations as in the observability doc so numbers are trustworthy.

## Rendering options

### 1. Custom React dashboards

- Backend exposes APIs that run pre-defined queries (or parameterized queries) against the analytics store (e.g. application DB aggregates or Athena).
- Admin workspace uses shared UI components (cards, tables, charts) and React Query to fetch and display data.
- **Pros:** Full control over UX, filters, and layout; no dependency on external dashboard tool. **Cons:** More build and maintain; you own all chart and query logic.

### 2. Embedded QuickSight (or similar)

- Dashboards are built in AWS QuickSight (or another BI tool) on top of the same data (e.g. Athena over S3).
- Admin workspace embeds these dashboards (iframe or SDK) or links to them; filters can be passed via URL/params if the tool supports it.
- **Pros:** Faster time-to-value for complex charts and ad-hoc analysis; less custom code. **Cons:** Another system to manage; embedding and SSO may need setup.

### 3. Hybrid

- **Overview and key funnels** in the admin workspace with custom React (calling your own analytics API) for a consistent, role-gated experience.
- **Heavy or ad-hoc analysis** via link or embed to QuickSight (or Athena queries) for power users.

**Recommendation for v1:** Prefer **hybrid**: build a small set of overview and funnel views in the admin UI (custom React + analytics API), and add links or embeds to QuickSight (or equivalent) for deeper dives. This keeps the “single pane” feel while leveraging AWS analytics where it helps.

## Slices and filters

The admin workspace should support at least:

- **Time range** – Presets (e.g. last 7 days, last 30 days) and custom range.
- **Platform** – Web vs mobile (from `eventSource` or equivalent).
- **Tenant** – If multi-tenant, filter by tenant/account (optional for v1).

All queries that power the workspace should use these filters so that drill-downs are consistent with the overview.

## Performance and access control

- **Heavy queries** – Run server-side only. The admin API should:
  - Use the analytics store (DB or Athena) with appropriate limits and time bounds.
  - Cache or pre-aggregate where possible (e.g. daily rollups) to keep response times acceptable.
- **Access control** – Only users with admin role can call analytics APIs or see embedded dashboards. If embedding QuickSight, use IAM or QuickSight’s embedding with row-level security so that only authorized users see data.
- **No raw PII** – Dashboards and APIs must expose only aggregates and non-PII dimensions (e.g. counts, IDs); no raw event payloads with user-identifying content in the admin UI. Align with the observability privacy doc.

## Summary

- Surface the metrics from the observability doc in the admin workspace with clear definitions.
- Use a hybrid of custom React (overview, funnels) and QuickSight/Athena (deeper analysis) for v1.
- Support time range, platform, and optionally tenant filters; run heavy work server-side and restrict access to admins only; never show raw PII in charts or tables.
