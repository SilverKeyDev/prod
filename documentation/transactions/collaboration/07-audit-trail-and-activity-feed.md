## Audit Trail and Activity Feed

### Problem / goal

Transactions involve many state changes over time:
- Checklist updates.
- Document uploads and signatures.
- Milestone date changes.
- Participant invites and role changes.

We need a robust **audit trail** and a user-friendly **activity feed** so that:
- Participants can see “who did what when.”
- Compliance and support teams can reconstruct transaction history if needed.

### Data model & invariants

- **ActivityEvent**
  - `id`
  - `transaction_id`
  - `actor_participant_id` (or system)
  - `event_type` (e.g. `checklist_item_completed`, `agreement_uploaded`, `agreement_signed`, `milestone_date_changed`, `participant_invited`, `participant_role_changed`, `integration_task_completed`, etc.)
  - `created_at`
  - `payload` (structured metadata: labels, previous/new values, etc.)

Invariants:
- Activity events are **append-only**:
  - No destructive editing.
  - Corrections are represented as new events.
- Activity logs are **filterable** by:
  - Event type.
  - Participant.
  - Time range.

### Flows / UX

1. **Event generation**
   - Whenever a significant change happens:
     - The responsible service (e.g. checklist, agreements, milestones, participants, integrations) emits an `ActivityEvent`.

2. **In-app activity feed**
   - Each transaction has a “History” or “Activity” tab:
     - Chronological list of ActivityEvents.
     - Grouped or filtered by:
       - Category (tasks, documents, calendar, participants, integrations).
   - Users can:
     - Click entries to navigate to the relevant checklist item, document, or milestone.

3. **Compliance and support views**
   - Internal views (for admins/support) may show:
     - Raw ActivityEvents with full payloads.
     - Cross-transaction searches for troubleshooting.

### Existing infrastructure to reuse / extend

- **Backend logging**
  - `Server/logger`:
    - Already defines centralized logging and PII scrubbing.
  - Wherever possible:
    - The same patterns for structured logging and redaction should apply to ActivityEvents.

- **Existing audit or history features**
  - Any current models or logs that:
    - Track document revisions.
    - Capture chat or messaging history.
  - Can inspire:
    - Event payloads and access patterns without duplicating logic.

### Gaps that require new work

- **ActivityEvent model and service**
  - Back-end storage and API to:
    - Append events.
    - Query events per transaction.

- **Event emission from services**
  - Checklist, documents, milestones, participants, and integration modules must:
    - Emit ActivityEvents at key points.
    - Use consistent `event_type` naming and payload schemas.

- **UI for activity feed**
  - A transaction-level activity feed component that:
    - Supports filtering and search.
    - Provides clear, human-readable summaries.

