## Calendar and Document Linking

### Problem / goal

We need a consistent way to:
- Turn **transaction milestones** and certain checklist items into calendar events.
- Link those events back to:
  - Checklists (what the event is for).
  - Documents and agreements (what should be signed or reviewed).

This should work with:
- The in-app calendar.
- Google Calendar (and future calendar providers) via existing integrations.

### Data model & invariants

- **Milestone**
  - As defined in `mechanics/05-deadline-and-milestone-engine.md`:
    - `id`, `transaction_id`, `type`, `target_date`, `source`.

- **CalendarEventLink**
  - `id`
  - `transaction_id`
  - `milestone_id` or `checklist_item_state_id`
  - `external_calendar_id` (e.g. Google calendar ID)
  - `external_event_id` (provider event identifier)
  - Optional:
    - `visibility_scope` (who sees it in-app: buyer, agent, all participants).

- **DocumentLink / AgreementLink**
  - As described in the domain model:
    - Connects checklist items/milestones to documents and agreements.

Invariants:
- Every external calendar event created via our UI should have a **backlink** through `CalendarEventLink`.
- Deleting or modifying events from our side should respect provider rules and keep links in sync.

### Flows / UX

1. **Automatic milestone events**
   - For key milestones (inspection window end, earnest money due, closing date):
     - System offers to create calendar events:
       - In the in-app calendar only.
       - And/or in connected Google Calendar, depending on user preference.
   - Events include:
     - Clear titles (e.g. “Inspection period ends”).
     - Descriptions with links back to the transaction.

2. **Manual event creation within a transaction**
   - Users can still create ad-hoc events tied to a transaction:
     - E.g. “Meet inspector on site.”
   - These events are linked to:
     - `transaction_id`.
     - Optionally a `checklist_item_state_id` or `milestone_id`.

3. **Document and agreement linking**
   - For events that correspond to signing or document review:
     - The event description and UI surfaces links to:
       - Associated `Agreement`/document.
       - The relevant checklist item.
   - On mobile/web:
     - Tapping an event from the transaction calendar opens:
       - A summary panel with associated tasks and docs.

### Existing infrastructure to reuse / extend

- **Calendar UI and creation flows**
  - `Client/packages/features/calendar/components/view/CalendarHeader.tsx`:
    - Handles navigation, connection status, and “Create Event” action.
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx`:
    - Manages event title, date/time, location (with suggestions), and calendar selection.

- **Google Calendar integration**
  - Existing hooks/services that:
    - List calendars (`GoogleCalendar` type).
    - Create events via `useGoogleEvents` or similar.
  - These should be **extended** to accept a `transactionId` and (optionally) `milestoneId` or `checklistItemId` so that:
    - Backlinks can be stored when events are created.

- **Documents/agreements features**
  - UIs under `Client/packages/features/documents/*` that:
    - Display agreements and document status.
  - Should be referenced by calendar event descriptions/links rather than creating a parallel “documents in calendar” layer.

### Gaps that require new work

- **Backend link models**
  - Introduce `CalendarEventLink` (and possibly a small service layer) to:
    - Store mapping between milestones/checklist items and external events.
    - Query by transaction for building transaction-specific calendar views.

- **Transaction-scoped calendar views**
  - Extend existing calendar views or add:
    - A “Transaction view” mode filtered by `transactionId`.
    - Tabs or filters for “All events” vs “This transaction”.

- **Bidirectional updates (future)**
  - In v1, treat Google Calendar as:
    - A push target (we create events and keep a local record).
  - Later, if needed:
    - Respond to provider updates (time changes, cancelations) and reconcile back to milestones/checklists.

