# Messaging SSE (architecture)

> **Status:** Shipped on web; mobile realtime gap  
> **Last verified:** 2026-07-24  
> **Code:** `Client/packages/hooks/data/polling/useMessagingSseSubscription.ts`, `Client/packages/features/messaging/hooks/data/`, `Server/app/utils` messaging realtime helpers

Server-sent events fan out new-message and read-state updates over Redis Pub/Sub. Ops checklist: [messaging-sse-operations.md](../../runbooks/messaging-sse-operations.md).

## Flow

```text
send / mark-read (after DB commit)
  → publish to sk:messaging:user:{user_id}
  → GET /api/v1/agent/chats/stream  OR  GET /api/v1/conversations/stream
  → client hook invalidates React Query keys
```

Both HTTP streams share the same per-user Redis channel and generator. Clients choose which URL to open and which query keys to invalidate.

## Client hooks (web)

| Hook | Mount | Stream | Invalidates |
|------|-------|--------|-------------|
| `useMessagingSseSubscription` | `useDataInitialization` in web `routes.tsx` (app-level) | `/api/v1/agent/chats/stream` | `queryKeys.agent.history`, `.conversations()`, `.notificationCounter()` |
| `useAgentChatsSse(enabled)` | `AgentMessaging`, `ClientMessaging` | same agent stream | same agent keys |
| `useWorkspaceMessagingSse(enabled)` | `WorkspaceMessagingShell`, `BrokerageMessaging` | `/api/v1/conversations/stream` | `queryKeys.workspaceConversations.history`, `.all` |

**Connect gates**

- App-level hook: `authReady && isAuthenticated && pathname.startsWith("/messaging")`
- Feature hooks: `enabled && authReady && isAuthenticated` (parent only mounts on messaging UI)

**Transport:** `fetch` + `ReadableStream`, `credentials: "include"`, `Accept: text/event-stream`. Skip hello events with `kind === "_hello"`. Reconnect starts at 2s, doubles, caps at 60s.

**Web double-subscribe:** On agent/client `/messaging`, the app-level hook and `useAgentChatsSse` both open the agent stream. On workspace `/messaging`, the app-level hook still opens the **agent** stream while `useWorkspaceMessagingSse` opens **conversations/stream** (same Redis channel; different invalidation keys).

## Stacks that receive events

| Stack | Personas | Client stream |
|-------|----------|---------------|
| Agent–client | buyer, seller, agent | agent chats stream |
| Workspace | brokerage, integrator, admin support | conversations stream |

Publish helpers (after commit): agent messaging / read-state services; workspace conversation service via `workspace/realtime.py` (payloads may include `stack: "workspace"`).

## Polling fallback

Conversation list polling on `/messaging` uses the **45s idle** interval (`messagingRoutes.conversations.pollingInterval`). The former 8s “active” interval is unused for the conversations key on that page. Notification counter polling remains separate (~10s).

## Mobile gap

- Mobile app does **not** mount `useDataInitialization` / the three SSE hooks.
- If `response.body` is unavailable, SSE hooks throw/reconnect and never deliver events.
- Treat **polling** (where wired) as the mobile fallback; do not claim mobile opens SSE today.

## Server notes

- Redis URL: `REDIS_URL`, else `CELERY_URL`
- Hello payload includes `redis_fanout: bool`; without Redis, streams heartbeat only
- Heartbeat ~25s; `X-Accel-Buffering: no` on responses
- Rate limit: 40/min/user on both stream endpoints

## Related

- Feature overview: [messaging.md](../../features/messaging/messaging.md)
- Persona matrix: [persona-variations.md](./persona-variations.md)
- Workspace API: [workspace-conversations.md](./workspace-conversations.md)
