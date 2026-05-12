## Notifications for Checklist-Driven Transactions

### Problem / goal

We want a consistent notification layer so that:
- Buyers, agents, and other participants are notified when **important events** happen in a transaction.
- Notifications are delivered via appropriate channels:
  - Mobile push.
  - Email.
  - In-app banners/toasts.
- Notification types are easy to extend as new engines and integrations are added.

### Data model & invariants

- **NotificationEvent** (conceptual)
  - `id`
  - `transaction_id`
  - `event_type` (e.g. `checklist_item_completed`, `agreement_signed`, `review_required`, `deadline_upcoming`, `deadline_overdue`, `integration_completed`)
  - `actor_participant_id` (who triggered it)
  - `target_participant_ids` (who should be notified)
  - `created_at`
  - `payload` (structured data for templating: item labels, dates, etc.)

Invariants:
- Notification events are **idempotent**:
  - Same underlying state transition should not emit duplicate notifications.
- Notification routing respects:
  - Role- and user-level preferences.
  - Channel capabilities (e.g. some events might be push-only).

### Flows / UX

1. **Checklist and deadline events**
   - When:
     - A checklist item changes state (e.g. from `todo` to `done` for a critical item).
     - A deadline is approaching (e.g. 3 days before inspection window ends).
   - System emits a `NotificationEvent` that:
     - Targets appropriate roles (buyer, agent, TC).
     - Uses templates to render content per channel.

2. **Signature and review events**
   - When an agreement is:
     - Sent, delivered, signed, or completed.
   - When review is:
     - Requested.
     - Completed (approved or changes requested).
   - Participants receive notifications tied to:
     - The relevant transaction.
     - Checklist item(s) and document(s).

3. **Integration-backed events**
   - When an integration task (e.g. HomeConcierge, later financial providers) changes:
     - From `in_progress` to `completed` or `failed`.
   - System notifies:
     - The buyer and optionally the agent that the step is done or needs attention.

### Existing infrastructure to reuse / extend

- **Notifications design docs**
  - `documentation/to-implement-soon/notifications/delivery-email.md` and related files:
    - Describe email delivery patterns, templates, and expected behavior.

- **Backend messaging/notification services**
  - Any existing utilities or services under:
    - `Server/app/services/*` that handle:
      - Email dispatch.
      - Push notifications.
      - In-app notifications or toast queues.

- **Frontend notification consumers**
  - Existing hooks/store for:
    - Toasts and in-app banners (e.g. `useUIStore` for `enqueueToast`).
  - Existing email templates or system emails that should be consistent with new notifications.

Rather than creating a transaction-specific notification stack, we should **emit structured NotificationEvents** into the existing delivery pipeline.

### Gaps that require new work

- **Notification event schema and service**
  - A centralized place to:
    - Define event types and payload shapes.
    - Emit events from:
      - Checklist updates.
      - Milestone/engine transitions.
      - Agreement/signature status changes.
      - Integration task life cycle.

- **Routing and preferences**
  - Per-role defaults:
    - Which events should go to which roles (buyer, agent, TC, loan officer, etc.).
  - Per-user overrides:
    - Email vs push vs in-app, digest options, quiet hours.

- **Templates and localization**
  - Clear mapping from `event_type` to:
    - Email subject/body templates.
    - Push payloads and deep-links.
    - In-app notification messages.

- **Observability and safety**
  - Metrics for:
    - Volume per event type.
    - Delivery success/failure.
  - Safeguards to avoid accidental notification storms:
    - Batch or debounce repeated events.
