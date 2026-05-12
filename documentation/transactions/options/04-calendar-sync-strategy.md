## Option: Calendar Sync Strategy

### Problem / goal

We need a strategy for syncing transaction-related events between:
- SilverKey’s internal transaction calendar.
- External calendars (initially Google Calendar).

Key questions:
- Which system is the **source of truth** for event timing?
- How do we handle edits and deletions?
- How complex should bidirectional sync be in v1?

### Existing infrastructure to align with

- **Current Google Calendar integration**
  - `Client/packages/features/calendar/components/view/CalendarHeader.tsx`
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx`
  - Any hooks/services that manage:
    - Access tokens.
    - Event creation and listing.

We should build on this integration rather than starting a separate one for transactions.

---

### Option A – Internal calendar as system of record (recommended)

**Idea:** Treat SilverKey’s transaction calendar as the **authoritative model**, and:
- Push events to Google Calendar as a convenience.
- Store back-links (`CalendarEventLink`) to external events.

- **Pros**
  - Clear ownership of data and behavior:
    - Transaction timelines and milestones live in one place.
  - Easier to reason about:
    - Deadline engine and checklist logic always reference internal milestones.
  - External calendars are:
    - Mirrors that can be regenerated if necessary.
- **Cons**
  - Edits done purely in Google Calendar (by the user) need explicit:
    - Handling rules (ignore, soft sync, or limited set of supported updates).

**Recommended v1 behavior**
- One-way push:
  - Internal changes (milestone updates, created events) push to Google Calendar.
  - Edits directly in Google Calendar are:
    - Either ignored.
    - Or treated as advisory and reconciled via a narrow set of mappings later.

---

### Option B – Google Calendar as system of record

**Idea:** Make Google Calendar the primary source of event timing:
- Internal milestone dates adapt to changes in Google.

- **Pros**
  - Respects user behavior:
    - Many users are accustomed to managing events in Google.
  - Changes made in Google reflect directly in SilverKey timelines.
- **Cons**
  - Makes the system highly dependent on:
    - External platform availability, semantics, and rate limits.
  - Hard to maintain:
    - A coherent transaction timeline when users can arbitrarily edit/delete events.
  - Complicates:
    - Compliance and auditability.

**Conclusion:** Too risky and complex for v1; not recommended.

---

### Option C – Dual-write with reconciliation

**Idea:** Try to treat both internal and Google calendars as peers:
- Changes in either system are reconciled into a common state.

- **Pros**
  - Potentially the best user experience in theory.
  - Minimizes friction for users who already live in Google Calendar.
- **Cons**
  - Very complex to implement:
    - Conflict resolution semantics.
    - Edge-case handling (partial failures, event series, time zone shifts).
  - High operational risk.

**Conclusion:** Overkill for v1; can be explored selectively for specific event types later.

---

### Recommended v1 path

Adopt **Option A (internal calendar as system of record)**:

- **Model**
  - All transaction-related events originate from:
    - Milestones computed by the deadline engine.
    - User-created in-app events.
  - External calendars:
    - Receive copies via existing Google integration.

- **Implementation notes**
  - Use `CalendarEventLink` to track:
    - The mapping between internal events and external provider events.
  - Limit interpretation of changes in Google to:
    - A small set of supported actions (if any) and document these clearly.

- **Future extensions**
  - For specific cases (e.g. manual ad-hoc events created only in Google):
    - Consider one-off import flows instead of full dual-sync.
