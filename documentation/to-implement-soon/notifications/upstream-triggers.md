# Upstream triggers (notifications)

This doc defines the **upstream contract** for generating notifications: *what events exist, what fields they must include, and how they map to notification types*.

## Principles

- **Events are the source of truth**: product code emits domain events; the notifications system decides channel delivery.
- **Idempotent by default**: every event must be safe to process multiple times.
- **Channel-agnostic triggers**: upstream events should not say “send email”; they should say what happened.
- **Auditability**: every notification attempt should be traceable back to an event (`correlationId`) and a deterministic `idempotencyKey`.

## Recommended AWS event backbone (implementation-ready)

**Default recommendation**: **Amazon EventBridge** as the event bus, with **SQS** as the fan-out buffer into workers.

- EventBridge handles producer publishing, schema discipline, and routing rules.
- SQS provides durable buffering, backpressure control, and per-consumer retries/DLQs.
- Workers can run on **Lambda** (simple, bursty) or **ECS** (steady high throughput).

## Event naming and versioning

Use a 3-part name: `<domain>.<entity>.<action>` and include a `schemaVersion`.

Examples:
- `conversations.message.received`
- `tours.tour.scheduled`
- `homes.price.dropped`
- `auth.mfa.challenge.created`

## Canonical event envelope (required)

Every event published to the bus must include the envelope below.

```json
{
  "eventName": "tours.tour.scheduled",
  "schemaVersion": 1,
  "occurredAt": "2026-03-06T18:42:11.123Z",
  "correlationId": "01J2Z9ZP9Y8JQK0W7J7GJQ3K5H",
  "idempotencyKey": "notif:tours.tour.scheduled:v1:t_123:u_456:2026-03-10T16:00:00Z",
  "severity": "transactional",
  "tenantId": "tenant_abc",
  "userId": "user_456",
  "locale": "en-US",
  "timezone": "America/Los_Angeles",
  "data": {
    "tourId": "t_123",
    "startsAt": "2026-03-10T16:00:00Z",
    "propertyId": "p_999",
    "agentUserId": "user_777"
  }
}
```

### Field definitions

- **`eventName`**: Stable name used in routing.
- **`schemaVersion`**: Increment on breaking payload changes.
- **`occurredAt`**: When the event happened (not when it was published).
- **`correlationId`**: Trace ID for logs + cross-system debugging.
- **`idempotencyKey`**: Deterministic key used to dedupe downstream notification sends.
- **`severity`**:
  - `transactional`: reminders, security, account status; must be reliable and quick
  - `engagement`: nudges, suggestions; can be throttled/quiet-hour delayed
  - `marketing`: campaigns; usually governed by stricter consent policies
- **`tenantId`**: Multi-tenant boundary (if applicable).
- **`userId`**: Primary recipient user.
- **`locale`** and **`timezone`**: Required for templates and scheduled sends.
- **`data`**: Event-specific payload (no PII beyond what the notification requires).

## Notification type mapping (routing)

Define a small set of **notification types** that are stable and user-configurable. The orchestrator maps `eventName` + `severity` + `data` into a `notificationType`.

Example mapping table:

| Event | Notification type | Typical channels |
|------|--------------------|------------------|
| `tours.tour.scheduled` | `tour_scheduled` | push + email |
| `tours.tour.reminder_due` | `tour_reminder` | push (high) + email (fallback) |
| `conversations.message.received` | `new_message` | push |
| `auth.mfa.challenge.created` | `mfa_challenge` | sms or email (depending on user setup) |
| `homes.price.dropped` | `price_drop` | push + email (digestable) |

## Preferences model (what upstream must assume exists)

Downstream should support preferences at these levels:

- **Per-notification-type** (e.g., user disables `price_drop`)
- **Per-channel** (push/email/sms)
- **Quiet hours** + time zone
- **Emergency bypass** (security/transactional can bypass quiet hours with explicit policy)

Upstream services should *not* read preferences; they emit events. The orchestrator enforces preferences.

## Idempotency and dedupe (required behavior)

Downstream must treat `idempotencyKey` as a **global unique key** for “this exact user-facing notification instance.”

Recommended `idempotencyKey` construction:

\[
idempotencyKey = notif:<eventName>:v<schemaVersion>:<primaryEntityId>:<userId>:<meaningfulTimeOrState>
\]

Examples:
- A scheduled reminder: include the scheduled timestamp.
- A state change: include the new state (e.g., `status=accepted`).

## Scheduling vs immediate sends

Two approaches (both supported):

- **Approach A: emit future-dated reminder events** (preferred)
  - A scheduler service emits `*.reminder_due` events at the right time.
  - Notification system remains stateless about “future jobs.”
- **Approach B: emit “scheduled notification request”**
  - Orchestrator stores a job and later enqueues delivery.
  - More centralized, but adds complexity to notifications service.

## Minimal “starter” event set (MVP)

- `conversations.message.received`
- `tours.tour.scheduled`
- `tours.tour.reminder_due`
- `homes.price.dropped`
- `auth.mfa.challenge.created`

## What not to do

- Don’t publish “send_email” / “send_push” events from product services.
- Don’t put raw PII (emails, phone numbers, tokens) into event payloads.
- Don’t rely on “at most once” delivery; design for repeats.
