> **Status:** Planned | **Last verified:** 2026-05-28

> **Planned work:** Linear [Notification Systems](https://linear.app/silverkey/project/notification-systems-f44e58377593) / [SIL-157](https://linear.app/silverkey/issue/SIL-157/transaction-milestone-notifications-emailsmspush).

## Audit trail and activity feed

There is **no transaction-level `ActivityEvent` feed**. Audit today is chat history, structured server logs, and partner exposure logging.

### What exists

- **Messaging history:** Append-only chat messages with roles, attachments, event-request metadata.
- **Server logging:** PII-scrubbed logs via `Server/logger` (checklist, DocuSign, API paths).
- **Partner exposure:** RESPA-aware placement logging for marketplace/checklist embeds (see partners feature).

### Planned

- Append-only `ActivityEvent` per transaction (checklist, documents, invites, milestones).
- In-app "History" tab with filters and deep links.

### Code pointers

| Area | Path |
| ---- | ---- |
| Chat history API | `Server/app/routes/agent/handlers/chats.py` — `get_chat_history` |
| Messaging hook | `Client/packages/features/messaging/hooks/data/messaging/useMessaging.ts` |
| Logger | `Server/logger/logger.py` |
| Partner placement | `Client/packages/features/partners/hooks/usePartnerPlacementPresentation.ts` |
| Feed feature (listings, not tx activity) | `Client/packages/features/feed/` |
