> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/docusign/notifications/messaging.py`; `Client/packages/store/slices/ui/` (toasts); `documentation/to-implement-soon/notifications/`

## Notifications for checklist-driven transactions

### Shipped today

- **In-app chat (DocuSign only):** Agreement sent/signed/completed events post deduped `__AGREEMENT_EVENT__` messages into the agent–buyer thread (`messaging.py`).
- **In-app toasts:** Success/error feedback via `enqueueToast` across calendar, documents, checklists, etc.
- **DocuSign envelope reminders:** Reminder/expiration settings on envelope create/update (`Server/app/services/docusign/envelopes/notification_settings.py`).

### Not built yet

- **Central `NotificationEvent` bus** — no unified schema, routing, or idempotency layer for checklist/deadline/integration events.
- **Email / SMS / mobile push** for transaction milestones — spec lives under [`documentation/to-implement-soon/notifications/`](../../to-implement-soon/notifications/README.md).
- **Role-based preferences** — no per-user channel toggles for transaction event types.
- **Integration completion alerts** — Move Concierge and future providers have click/view analytics, not buyer push on partner completion.

### Target shape (unchanged intent)

Emit structured events from checklist merges, milestone engine, agreement webhooks, and partner integrations; fan out through one delivery pipeline with templates and deep links. Until then, extend existing surfaces (chat, toasts) rather than a parallel stack.
