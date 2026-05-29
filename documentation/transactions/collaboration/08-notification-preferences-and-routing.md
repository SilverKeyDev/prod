> **Status:** Partial | **Last verified:** 2026-05-28

## Notification preferences and routing

**In-app messaging unread counts** and realtime SSE are shipped. Per-event notification preferences and multi-channel routing (email/push/digest) for transaction events are **not**.

### Shipped

- **Unread counter:** `/api/v1/agent/notification-counter`; Zustand `useNotificationStore` drives nav badges.
- **Realtime:** Redis-backed SSE fanout on `/api/v1/agent/chats/stream`; polling fallback via `useDataPolling`.
- **Read receipts:** `mark_chat_as_read`, `acknowledgeActiveConversationAsRead` in messaging hooks.
- **Communication prefs:** `user_communication_prefs` table exists in preferences schema (profile onboarding)—not wired to transaction event routing.

### Gaps

- No `NotificationPreference` API for transaction event categories.
- No role-based notification defaults (buyer vs agent vs TC).

### Code pointers

| Area | Path |
| ---- | ---- |
| Notification store | `Client/packages/store/slices/notifications/notifications.slice.ts` |
| Agent chats + unread | `Client/packages/features/messaging/hooks/data/useAgentChats.ts` |
| Polling integration | `Client/packages/hooks/data/polling/useDataPolling.ts` |
| SSE handler | `Server/app/routes/agent/handlers/chats_stream.py` |
| Counter service | `Server/app/services/agent/conversation_service.py` — `get_notification_counter` |
| Nav badges | `Client/apps/web/app/layouts/sidebar/Sidebar.web.tsx` |
