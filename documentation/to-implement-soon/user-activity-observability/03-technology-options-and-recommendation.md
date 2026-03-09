## Technology Options & Recommendation

This document compares implementation options for the user activity observability stack and makes a recommendation for a v1 that fits SilverKey’s existing stack and AWS usage.

The goal is to reuse as much of the current logging and deployment setup as possible, while setting ourselves up for richer analytics later.

### Option A – Extend Existing Logger + Application Database

**Idea:** Use the existing `Client/logger` and `Server/logger` infrastructure to emit structured events, and store high‑value events in dedicated tables in the primary application database (or a closely related reporting database).

**How it works**

- Extend logging utilities so that certain categories (e.g. `ANALYTICS` or `EVENTS`) are:
  - Written both to logs for debugging, and
  - Forwarded into a `user_events` table via server‑side ingestion.
- Define a minimal schema (matching the event model in the data‑sources doc), and write:
  - Upserts or inserts from backend services when events arrive from clients.
  - Direct writes from backend domain events.
- Query this table with:
  - Existing ORM/SQL tools.
  - Simple reporting endpoints consumed by the admin workspace.

**Pros**

- Leverages **existing** database and tooling.
- Simple to get started: minimal new infrastructure.
- Easy to create custom queries and APIs tailored to the product.

**Cons**

- Application DB may not be ideal for:
  - High‑volume event streams.
  - Long‑term historical analysis and heavy analytics workloads.
- Scaling storage and query performance for large datasets can be more complex.
- Harder to integrate with AWS‑native analytics tools (Athena, QuickSight) without duplicating data.

### Option B – AWS‑Native Analytics Pipeline (CloudWatch → Kinesis → S3 → Athena/QuickSight)

**Idea:** Treat user activity events as a log/stream that ultimately lands in S3, where it can be queried and visualized using AWS analytics tools.

**How it works**

- Frontend and backend emit structured events via existing loggers, tagged with a category or field that makes them easy to distinguish.
- Use AWS infrastructure to:
  - Route relevant logs (or explicit event payloads) from CloudWatch or services into **Kinesis Firehose**.
  - Deliver batched, compressed data to an **S3** bucket in a partitioned layout (by date, tenant, etc.).
- Define **Athena** table(s) over the S3 data using the canonical event schema.
- Build **QuickSight** dashboards on top of Athena queries for:
  - Funnels, retention, feature adoption.
  - Error and performance views.
- Optionally expose key metrics back to the admin workspace over an internal API.

**Pros**

- Designed for **high‑volume, append‑only event data**.
- Scales storage and compute independently; S3 + Athena is cost‑effective for analytics.
- Strong integration with **QuickSight** for dashboards and visualizations without building everything in React.
- Keeps heavy analytics workloads away from the primary application DB.

**Cons**

- More AWS infrastructure to configure and maintain (Firehose, S3 layout, Athena, QuickSight).
- Higher initial setup complexity (IAM, security, schemas, partitioning).
- Queries are less “transactional” and more batch‑oriented; near‑real‑time dashboards require some tuning.

### Option C – Product Analytics Tool (PostHog / Amplitude / Similar)

**Idea:** Integrate a dedicated product analytics platform that specializes in behavioral event tracking, funnels, and cohorts.

**How it works**

- Emit a subset of user activity events directly to the chosen tool’s SDK from web and mobile.
- Optionally mirror backend domain events into the tool via server‑side integration.
- Use the platform’s UI to configure:
  - Event properties.
  - Dashboards and funnels.
  - Cohort and retention analyses.

**Pros**

- Very fast path to rich product analytics (funnels, retention, cohorts) without building infrastructure.
- Mature querying and visualization capabilities tailored for product teams.
- Often includes built‑in features like feature flags and experiments.

**Cons**

- Introduces a new external dependency and cost model.
- Data lives in a **separate system**, making tight integration with internal admin workflows more complex.
- Requires careful configuration to stay aligned with privacy and PII constraints.
- May duplicate effort if we also invest in AWS‑native analytics.

### Hybrid Approach and Migration Path

In practice, we do not need to choose a single option forever. A pragmatic approach is:

1. **Standardize event emission** using the canonical schema and logging helpers (this is required regardless of destination).
2. Start with a **lightweight ingestion pipeline**:
   - Either into the application DB (Option A) for a restricted set of events, or directly into S3 via a narrow Firehose stream (Option B).
3. Add **QuickSight dashboards** or minimal admin‑workspace charts to validate that the data model is useful.
4. If/when product analytics needs outgrow the initial setup, re‑use the canonical schema to integrate a dedicated tool (Option C) for advanced analysis, while still keeping an internal analytics store.

### Recommended v1 Direction

For SilverKey’s current stack and AWS usage, the recommended v1 is:

- **Primary choice:** Option **B** – AWS‑native pipeline via S3 + Athena + QuickSight.
  - Use existing loggers as the source of truth.
  - Route a curated set of analytics events into Firehose → S3.
  - Define one or a few Athena tables that match the canonical event schema.
  - Build initial dashboards in QuickSight for:
    - Onboarding funnels.
    - Feature adoption.
    - Error and latency profiles.
- **Fallback / complement:** For specific low‑volume, operational metrics that need transactional queries or tight coupling with application logic, we can:
  - Maintain a small `user_metrics` or `aggregates` table in the application DB that is derived from the event stream and exposed via APIs to the admin workspace.

This approach:

- Keeps the **core data lake** on AWS primitives that scale with usage.
- Avoids tight coupling of analytics workloads to the app DB.
- Can be iterated on incrementally, without blocking on a large new vendor integration.

Future work can evaluate integrating a product analytics tool on top of this foundation, especially if we want self‑serve analytics for a broader team beyond internal admin use.

