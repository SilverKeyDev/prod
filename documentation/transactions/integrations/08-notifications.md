> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/docusign/notifications/messaging.py`; `Client/packages/store/slices/ui/` (toasts)

## Notifications for checklist-driven transactions

### Shipped today

- **In-app chat (DocuSign only):** Agreement sent/signed/completed events post deduped `__AGREEMENT_EVENT__` messages into the agent–buyer thread (`messaging.py`).
- **In-app toasts:** Success/error feedback via `enqueueToast` across calendar, documents, checklists, etc.
- **DocuSign envelope reminders:** Reminder/expiration settings on envelope create/update (`Server/app/services/docusign/envelopes/notification_settings.py`).

### Not built yet

- **Central `NotificationEvent` bus** — no unified schema, routing, or idempotency layer for checklist/deadline/integration events.
- **Email / SMS / mobile push** for transaction milestones — track in Linear [Notification Systems](https://linear.app/silverkey/project/notification-systems-f44e58377593) ([SIL-157](https://linear.app/silverkey/issue/SIL-157/transaction-milestone-notifications-emailsmspush), [SIL-113](https://linear.app/silverkey/issue/SIL-113/text-notifications), [SIL-115](https://linear.app/silverkey/issue/SIL-115/mobile-notifications)).
- **Role-based preferences** — no per-user channel toggles for transaction event types.
- **Integration completion alerts** — Rev-share placements have click/view analytics, not buyer push on partner completion.

### Target shape (unchanged intent)

> **Shipped feature docs:** [messaging.md](../../client/features/messaging.md).

Emit structured events from checklist merges, milestone engine, agreement webhooks, and partner integrations; fan out through one delivery pipeline with templates and deep links. Until then, extend existing surfaces (chat, toasts) rather than a parallel stack.
