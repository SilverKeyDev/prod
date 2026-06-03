> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Client/packages/features/calendar/` (Google Calendar UI + agenda); `Client/packages/hooks/data/agenda/signingTodosForChecklistStep.ts`; `Server/app/models/documents/agreement_link.py`

## Calendar and document linking

### Shipped today

- **Google Calendar:** OAuth connect, list/create/update/delete events via `useGoogleEvents` and `useCalendarScreen`; agent and client calendar views.
- **Agenda + signing:** Upcoming agenda merges calendar events with DocuSign signing to-dos (`useUpcomingEventsData`, `useSigningTodos`). Signing rows link to checklist steps through `AgreementLink.linked_item_id` (e.g. `offer.3`) or title fallback — see `signingTodosForChecklistStep.ts`.
- **Event kinds:** Transaction-adjacent kinds include `closing_signing` (`calendarEventKinds.ts`); create flow supports mutual availability hints when both parties link Google.
- **Checklist ↔ agreement links:** `AgreementLink` stores `transaction_id`, `agreement_id`, and checklist step keys. Library rows expose `linked_checklist_item_id` (`Server/app/routes/documents/report_document_library_rows.py`).

### Not built yet

- **`CalendarEventLink`** — no persisted backlink from milestones/checklist items to external Google event IDs.
- **Automatic milestone events** — no engine that creates calendar events from transaction deadlines.
- **Transaction-scoped calendar filter** — calendar is user/workspace scoped, not filtered by `transaction_id`.
- **Bidirectional sync** — Google is a push target; provider-side edits are not reconciled to milestones.

### Related docs

- Calendar UX patterns: [`documentation/client/features/`](../../client/features/README.md) (no dedicated calendar doc yet; see `Client/packages/features/calendar/` README if present).
- Signing linkage: [07-signing-review-and-completion.md](./07-signing-review-and-completion.md).
