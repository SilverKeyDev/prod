# Messaging SSE — operations checklist

Server-sent events for messaging use two HTTP entry points that share one Redis channel:

| Endpoint | Stack |
|----------|-------|
| `GET /api/v1/agent/chats/stream` | Agent–client (buyer / seller / agent) |
| `GET /api/v1/conversations/stream` | Workspace (brokerage / integrator / admin support) |

Both return `text/event-stream`. Fan-out uses **Redis Pub/Sub** when **`REDIS_URL`** or **`CELERY_URL`** is set on the API. Channel: **`sk:messaging:user:{user_id}`** (same Redis instance as Celery is acceptable; keys are namespaced).

Architecture detail: [sse.md](../architecture/messaging/sse.md).

## Client behavior (web)

Three hooks may open streams on `/messaging`:

1. **`useMessagingSseSubscription`** (app-level via `useDataInitialization`) — agent stream when authenticated and path starts with `/messaging`
2. **`useAgentChatsSse`** — agent stream from agent/client messaging shells
3. **`useWorkspaceMessagingSse`** — conversations stream from workspace messaging shells

Transport is **`fetch` + `ReadableStream`** with **`credentials: "include"`** so cookie session auth matches normal API calls.

**Conversation list** polling on `/messaging` uses the **idle** interval only (**45s** from `messagingRoutes.conversations.pollingInterval`). SSE carries realtime updates when Redis fan-out is enabled.

## Mobile

The mobile app does **not** mount the SSE hooks today. If `response.body` is unavailable (common on some RN environments), SSE cannot deliver events. Do not assume mobile opens a long-lived stream; rely on existing polling/refetch behavior until a native subscription lands.

## Fan-out and workers

- **Multi-worker / multi-instance:** Without Redis, each worker only sees its own subscribers; enable **`REDIS_URL`** (or reuse **`CELERY_URL`**) so send/mark-read publishes after commit and all workers deliver events.
- **Gunicorn:** Default **sync** workers block one request per worker; long-lived SSE ties up workers. Prefer **`gevent` / `eventlet`** workers for multiplexing idle streams, or **`gthread`** with enough **`--threads`**. Validate DB driver compatibility with monkey-patching before choosing gevent/eventlet.

## Reverse proxy

- Flask sets **`X-Accel-Buffering: no`** on the stream response.
- **Nginx (example):** `proxy_http_version 1.1`, `proxy_set_header Connection ''`, **`proxy_buffering off`**, `proxy_cache off`, long **`proxy_read_timeout`** (e.g. 3600s). Match equivalent settings on **ALB / CloudFront** if applicable.

## Capacity

- Each open stream is a long-lived TCP connection; raise **`ulimit -n`** / container **nofile** on app and proxy hosts for expected concurrent messaging users.
- Web may open **two** agent-stream connections on agent/client `/messaging` (app-level + feature hook) — size capacity accordingly.

## Reconnect

- Clients reconnect with exponential backoff (start 2s, cap 60s).

## Server env

- **`REDIS_URL`:** preferred dedicated URL for messaging pub/sub (optional logical DB index can be added later if you isolate Celery keyspace).
- **`CELERY_URL`:** used as fallback when **`REDIS_URL`** is unset so existing Celery deployments get fan-out without a new variable.
