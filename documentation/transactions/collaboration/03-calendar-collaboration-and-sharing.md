## Calendar Collaboration and Sharing

### Problem / goal

Transaction-related calendar events (milestones, inspections, signings, etc.) should be:
- Visible to the right participants.
- Editable by the right roles.
- Linked back to the transaction, checklists, and documents.

We need clear rules for:
- Which events each role sees.
- Who can create, edit, or delete events.
- How shared events relate to personal calendars (e.g. Google Calendar).

### Data model & invariants

- **CalendarEventLink** (see `integrations/06-calendar-and-document-linking.md`)
  - `transaction_id`
  - `milestone_id` or `checklist_item_state_id`
  - `external_calendar_id`, `external_event_id`
  - `visibility_scope` (e.g. `buyers`, `agents`, `all_participants`)

Invariants:
- Transaction calendar views are consistent:
  - All participants see the same list of transaction events they are allowed to see.
- Personal calendar sync:
  - Is per-user, but events remain tied to transaction context through `CalendarEventLink`.

### Flows / UX

1. **Transaction calendar view**
   - Each participant can open a **transaction-scoped calendar**:
     - Shows:
       - Milestones.
       - Checklist-related events.
       - Ad-hoc events associated with the transaction.
   - Filters:
     - “All transaction events.”
     - “My events.”

2. **Role-based visibility**
   - Buyer:
     - Sees events relevant to their responsibilities and awareness (e.g. inspections, signings, closings).
   - Agent:
     - Sees all transaction events and can manage them.
   - TC, loan officer, escrow:
     - See events based on role-specific rules (e.g. loan-related events surfaced to loan officer).

3. **Editing and creation permissions**
   - Agent and TC (or similar roles) can:
     - Create, edit, or cancel most transaction events.
   - Buyer:
     - Can create personal events linked to the transaction (e.g. “Meet inspector”) with limited editing permissions on system-generated milestones.
   - Changes propagate to:
     - In-app calendar.
     - Linked external calendars (subject to provider constraints).

4. **External calendar sync**
   - When participants connect Google Calendar:
     - They can choose:
       - Which transaction events to sync.
       - Whether to sync all transactions or only active ones.

### Existing infrastructure to reuse / extend

- **Calendar UI and connection flows**
  - `Client/packages/features/calendar/components/view/CalendarHeader.tsx`:
    - Shows connection status and “Create Event” CTA.
  - `Client/packages/features/dashboard/components/calendar/components/CalendarConnectionPrompt.tsx`:
    - Handles Google Calendar connection prompts.

- **Event creation UX**
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx`:
    - Manages event creation, including:
      - Title, date/time, calendar selection, and location.
  - Should be extended with:
    - Optional `transactionId` context.
    - Visibility controls where appropriate.

We should **extend these existing components and hooks** with transaction context and collaboration rules rather than building a separate calendar stack.

### Gaps that require new work

- **Transaction-scoped calendar views**
  - Add a mode or dedicated routes where:
    - Calendar is filtered by `transactionId`.
    - Role-based visibility rules are applied before rendering.

- **Permission enforcement**
  - Backend checks to ensure:
    - Only authorized roles can create/edit/delete certain events.
    - Participants see only those events they are allowed to see.

- **Sync choices per user**
  - Preferences that let each participant control:
    - Which transaction events sync to their personal calendar.
    - Whether to include system-generated milestones or only user-created events.

