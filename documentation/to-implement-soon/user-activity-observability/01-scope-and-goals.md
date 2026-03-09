## Scope & Goals

This document defines the scope and goals for a unified **user activity observability** system at SilverKey. The intent is to capture enough high‑quality behavioral and operational data from our products to:

- Inform iteration choices with clear evidence instead of guesswork.
- Reveal how users actually move through the product (funnels, retention, feature adoption).
- Surface meaningful statistics and insights in an admin workspace that is safe, privacy‑aware, and maintainable.

The goal is not to “log everything” indiscriminately, but to **intentionally observe the right events** with consistent structure and guardrails.

### Problem Statement

Today, product decisions and debugging often rely on:

- Anecdotal feedback.
- Local logs or ad‑hoc queries that are hard to reproduce.
- Metrics that are scattered or missing for key flows.

We want a single, coherent view of:

- What users are doing (and where they drop off).
- How core features are performing over time.
- Which changes correlate with improvements or regressions.

The observability system should make it easy to answer these questions without “one‑off” instrumentation every time.

### In‑Scope Activity

The observability system will initially focus on:

- **Product usage flows**
  - Page/screen views and navigation between major surfaces.
  - Key funnel steps (e.g. onboarding steps, key form submissions, primary feature completion events).
  - Feature‑level interactions (e.g. “clicked save home”, “opened property details”, “edited checklist item”).
- **Performance and reliability**
  - Latency bands for critical interactions (fast/okay/slow).
  - Error events (client and server) tied to user context and route/screen.
  - Retries, timeouts, and degraded modes that impact UX.
- **Experiment and feature rollout signals**
  - Exposure to experiments/feature flags.
  - Variant assignment and key outcome events.

These events should be emitted consistently from:

- **Web client** (apps/web) via the shared client logger.
- **Mobile client** (apps/mobile) via the same logical event model.
- **Backend services** via the server logger and domain events.

### Out‑of‑Scope Activity (for now)

To keep the system focused and privacy‑aware, the following are explicitly out of scope for v1:

- Logging raw free‑text content (notes, messages, descriptions).
- Storing full request/response bodies that may contain secrets or PII.
- Fine‑grained low‑level telemetry like every keystroke or mouse movement.
- Marketing attribution pipelines (ads, campaigns) beyond basic referrers, unless later integrated via a separate design.

These may be revisited later with dedicated designs and stricter privacy controls.

### Goals and Success Criteria

**Primary goals**

- Provide a **canonical, documented event model** that all clients and services use.
- Make it possible to answer core product questions, such as:
  - How many users reach each step of onboarding?
  - Which features are used most/least, and by whom?
  - Where do users most frequently encounter errors or timeouts?
- Feed a new **admin workspace** with metrics and drill‑downs that you can use to:
  - Prioritize roadmap and UX changes.
  - Detect regressions quickly.
  - Validate whether shipping changes actually improved behavior.

**Success looks like:**

- For any key flow, you can pull up a **funnel view** and basic time‑series metrics without adding new instrumentation.
- For a newly shipped feature, you can quickly see:
  - Reach (how many users saw it),
  - Adoption (how many used it),
  - Quality (error/latency profiles).
- When making trade‑offs between possible iterations, you can reference concrete, trusted data from the observability system instead of intuition alone.

### Non‑Goals

This observability work is **not** intended to:

- Replace domain‑specific analytics that may live in other systems (e.g. billing/Stripe reports).
- Implement full marketing automation or customer‑journey tooling.
- Weaken existing security or PII controls; any new data collection must comply with our security rules and privacy expectations.

Those areas can build on top of the same event infrastructure later, but are not required for the first iteration of user activity observability.

