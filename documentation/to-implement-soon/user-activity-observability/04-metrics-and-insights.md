## Metrics & Insights

This document defines the core metrics and insights that the user activity observability system should support, and how they map to the underlying event model.

The intent is to standardize **what we care about measuring**, so instrumentation and dashboards stay aligned with product goals.

### High‑Level Metric Categories

We can group metrics into several broad categories:

- **Acquisition & activation**
  - How new users arrive and complete key setup steps.
- **Engagement & feature adoption**
  - How often and how deeply users engage with important features.
- **Retention**
  - How often users return and continue to get value.
- **Reliability & performance**
  - How errors and latency impact user experience.

Each metric below should be defined in three ways:

- Plain‑language definition.
- Calculation based on events.
- Expected representation in the admin workspace (chart/table).

### Acquisition & Activation

#### New activated users

- **Definition**
  - A user is “activated” when they complete the minimal set of steps that correlate with long‑term value (e.g. finishing onboarding and performing at least one core action).
- **Calculation**
  - Count of distinct `userId` per time window (day/week/month) who:
    - Emit an `onboarding_completed` event, and
    - Emit at least one core feature event (e.g. `property_saved`, `checklist_item_completed`) within a configurable activation window after signup.
- **Admin workspace view**
  - Time series chart of activated users over time.
  - Breakdown by acquisition source or plan type if available.

#### Onboarding funnel completion rate

- **Definition**
  - Percent of users who reach each step of the onboarding funnel, and the drop‑off between steps.
- **Calculation**
  - For a funnel defined as `onboarding_step_1` → `onboarding_step_2` → `onboarding_completed`:
    - For a given period, count unique `userId` that emit each step event.
    - Compute completion and drop‑off rates between steps.
- **Admin workspace view**
  - Funnel visualization with counts and percentages per step.
  - Ability to filter by date range and platform (web vs mobile).

### Engagement & Feature Adoption

#### Feature usage frequency

- **Definition**
  - How often key features are used, and by how many distinct users.
- **Calculation**
  - For a given feature (e.g. “Save property”):
    - Count total `eventType` occurrences (e.g. `property_saved`) per time window.
    - Count distinct `userId` emitting that event per time window.
- **Admin workspace view**
  - Bar or line chart per feature over time.
  - Table of features with usage counts and distinct users for a chosen period.

#### Active users (DAU/WAU/MAU)

- **Definition**
  - Number of distinct users who perform any meaningful action in a given time window.
- **Calculation**
  - For each time window:
    - Count distinct `userId` that emit at least one “active” event (e.g. page view plus at least one feature event).
- **Admin workspace view**
  - Time series chart of DAU/WAU/MAU.
  - Optionally, ratios (DAU/MAU) for engagement health.

### Retention

#### N‑day retention

- **Definition**
  - Percentage of users who return to perform any meaningful action after N days.
- **Calculation**
  - For a cohort of users who first activated during a given period:
    - For each N (e.g. 1, 7, 30), determine whether they emit at least one “active” event on day N or within a defined range around N.
    - Compute percentage of the cohort who return.
- **Admin workspace view**
  - Cohort retention table (rows = cohorts by activation week, columns = day N).
  - High‑level retention curves for key segments (e.g. by platform or feature usage).

### Reliability & Performance

#### Error rate per feature

- **Definition**
  - Frequency of errors encountered within or adjacent to a given feature, relative to successful usage.
- **Calculation**
  - For each feature:
    - Count events of type `client_error` or `server_error` linked to that feature or route.
    - Count corresponding successful events (e.g. `property_saved` without error).
    - Compute error rate = errors / (errors + successes) for a given period.
- **Admin workspace view**
  - Table of features with error rates and sample sizes.
  - Ability to drill into recent error examples or patterns.

#### Latency profiles for key actions

- **Definition**
  - Distribution of end‑to‑end latency for important operations (e.g. saving a property, loading a complex page).
- **Calculation**
  - For events that include `durationMs`:
    - Aggregate by percentile bands (e.g. p50, p90, p99) per feature and per day.
  - Alternatively, bucket into ranges (fast/ok/slow) and compute counts per bucket.
- **Admin workspace view**
  - Time series of latency percentiles per feature.
  - Histogram or bucketed bar chart for a chosen time period.

### Connecting Metrics to the Admin Workspace

The admin workspace should surface these metrics in a way that:

- Lets you **start from a high‑level view** (e.g. overall activation, DAU, key feature usage).
- Supports **drill‑down** into specific flows, segments, or time windows.
- Makes it easy to move from an insight (e.g. “error rate spiked here”) to the underlying events/logs for investigation.

Whether the charts are backed by:

- Custom APIs querying an internal store, or
- Embedded AWS QuickSight dashboards on top of Athena,

they should use the same definitions and calculations documented here, so that numbers are consistent across tools.

This document should evolve as:

- New features are added and prioritized.
- We learn which metrics are most predictive of user value.
- We adjust what “activation” and “healthy engagement” mean for SilverKey.
