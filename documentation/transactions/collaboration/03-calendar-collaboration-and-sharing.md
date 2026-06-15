> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [docusign-integration.md](../../client/features/docusign-integration.md).

## Calendar collaboration and sharing

Calendar is **user-scoped** (buyer or agent), not a transaction-participant workspace. Collaboration happens via Google sync, messaging event requests, and checklist-generated reminders.

### Shipped

- **Google Calendar:** OAuth connect, event CRUD, availability scheduling.
- **Event requests:** Agents propose times in chat; buyers accept/reject (`__EVENT_REQUEST__` messages, PATCH event-request status).
- **Client calendar access:** Agents view client events when permitted (`useClientCalendarEventsQuery`).
- **Checklist-linked events:** Relative-day events created on checklist checkoff (see checklist collaboration doc).

### Gaps

- No transaction-scoped calendar filter or role-based event visibility (TC, lender, etc.).
- No per-user sync preferences for transaction milestones.

### Code pointers

| Area | Path |
| ---- | ---- |
| Calendar shell | `Client/packages/features/calendar/components/shell/Calendar.tsx` |
| Create event | `Client/packages/features/calendar/components/view/eventModal/CreateEventModal.tsx` |
| Google connect | `Client/packages/features/calendar/components/view/CalendarConnectionPrompt.tsx` |
| Event request card | `Client/packages/features/calendar/components/agenda/EventRequestCard.tsx` |
| Messaging event handlers | `Client/packages/features/messaging/hooks/data/eventRequests/useMessagingEventHandlers.test.handlers.ts` |
| Server calendar routes | `Server/app/routes/calendar/google_calendar.py` |
| Checklist → calendar | `Server/app/services/transactions/calendar_from_checklist.py` |
