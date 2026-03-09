## Data Sources & Event Schema

This document enumerates the primary data sources for user activity observability and defines a canonical event schema that all clients and services should use when emitting events.

The goal is to have **one mental model** for events, regardless of whether they originate from web, mobile, or backend.

### Data Sources

#### Web Client (apps/web)

Events emitted from the web app should capture:

- **Page and navigation events**
  - Page/screen identifier (e.g. `SettingsPage`, `PropertyDetails`, `ChecklistHome`).
  - Route path and important route params (e.g. property id, checklist id).
- **Feature interactions**
  - User actions tied to core flows (e.g. `property_saved`, `checklist_item_completed`, `calendar_event_created`).
- **Client‑side errors and performance**
  - Frontend errors, including relevant error type and message (scrubbed for PII).
  - Basic performance signals (e.g. slow API calls as perceived by the client).

These events should be produced via the existing `Client/logger` utilities, extended to support a structured `event` category for analytics.

#### Mobile Client (apps/mobile)

Events emitted from the mobile app should mirror the same logical model:

- Use the same **event naming conventions** and schemas where possible.
- Use platform‑appropriate transport, but keep payloads structurally identical so they can land in the same downstream stores and dashboards.

Where platform differences exist (e.g. navigation stacks, native components), they should be encoded as clearly documented event properties, not as completely different event types.

#### Backend Services

The backend is a critical source of truth for:

- **Domain events**
  - E.g. `transaction_created`, `transaction_stage_updated`, `checklist_generated`, `notification_sent`.
- **API‑level events**
  - Requests and responses for important operations (without storing sensitive payloads).
- **Background jobs**
  - Success/failure of scheduled or async workflows that impact user experience.

These should be emitted via `Server/logger` with structured payloads that match the canonical event schema, including the relevant user/tenant context whenever available.

### Canonical Event Schema

All user activity events should follow a shared base schema, with room for domain‑specific fields.

At minimum, every event should include:

- `eventId` – unique identifier for the event (UUID).
- `eventType` – stable string name (e.g. `page_view`, `property_saved`, `checklist_item_completed`, `notification_sent`).
- `eventSource` – `web`, `mobile`, or `backend`.
- `timestamp` – ISO 8601 timestamp in UTC.
- `userId` – internal user identifier (or anonymous/session id if unauthenticated).
- `tenantId` – if multi‑tenant, the tenant or account identifier.
- `sessionId` – identifier linking events from a single session.
- `context` – structured object with:
  - `route`/`screen` (e.g. `/settings`, `SettingsPage`).
  - `device` info where available (platform, OS version, app version).
  - `experimentAssignments` (map of experiment keys to variant ids).
- `properties` – event‑specific payload fields (see below).

#### Event Type Categories

To keep things organized, we can group event types into high‑level categories:

- **Navigation events**
  - `page_view`, `screen_view`, `route_transition`.
- **Feature events**
  - `feature_used`, with `featureName` and more specific details.
  - Or more descriptive types like `property_saved`, `calendar_event_created`, `checklist_item_completed`.
- **Outcome events**
  - `conversion_completed`, `onboarding_completed`, `task_completed`.
- **Error and performance events**
  - `client_error`, `server_error`, `api_timeout`, `slow_operation_detected`.

Each category should define:

- Required fields in `properties` (e.g. `featureName`, `success`, `durationMs`).
- Optional fields for richer analysis (e.g. `errorCode`, `httpStatus`, `retryCount`).

### PII and Redaction Rules

Events must respect our existing logging and security rules:

- Do **not** include:
  - Raw email addresses, phone numbers, financial data, or secrets in `properties`.
  - Free‑text fields that might contain sensitive content.
- Where user identification is needed:
  - Use internal IDs (`userId`, `tenantId`) and rely on secure joins for further analysis, instead of duplicating PII into the analytics stream.
- Leverage existing PII scrubbing logic from:
  - `Client/logger/pii.ts`
  - `Server/logger/pii.py`

If a new event type requires special handling, document it explicitly and extend the scrubbing rules as needed.

### Relationship to Existing Logging Utilities

The canonical event schema should be implemented as a thin layer on top of existing logging utilities:

- **Frontend**
  - Add a helper such as `logEvent(eventType, properties, contextOverrides?)` that:
    - Enforces required fields.
    - Attaches standard context (user, route, device, experiments).
    - Uses `log.info` or a dedicated category under `LOG_CATEGORIES` (e.g. `ANALYTICS`).
- **Backend**
  - Add a similar helper for emitting domain events and analytics events via `log.info` with a known category and structured payload.

Downstream, this ensures that:

- All analytics events can be filtered and routed based on:
  - Log category.
  - Presence of `eventType` and the canonical fields.
- Storage (database/S3) and analytics tools can rely on a consistent shape regardless of source.

### Versioning and Evolution

To avoid schema chaos over time:

- Treat `eventType` names as **stable contracts**. Deprecate and replace them intentionally rather than reusing them for different semantics.
- Prefer **additive changes** to the schema (adding optional fields) over breaking changes.
- When a breaking change is necessary, introduce a new `eventType` or a versioned field (e.g. `eventType: checklist_item_completed.v2`) and document the difference here.

This document should be updated as we add new categories of events or refine the schema, so that all parts of the stack keep emitting compatible data. 

