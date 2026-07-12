# Messaging SSE — operations checklist

Server-sent events for agent chat use **`GET /api/v1/agent/chats/stream`** (`text/event-stream`) with **Redis Pub/Sub** fan-out when **`REDIS_URL`** or **`CELERY_URL`** is set on the API. Channel prefix: **`sk:messaging:user:{user_id}`** (same Redis instance as Celery is acceptable; keys are namespaced).

## Client behavior

- The web and mobile apps **always** open the messaging SSE stream when the user is **authenticated** and the route is under **`/messaging`** (see `useMessagingSseSubscription`).
- Transport is **`fetch` + `ReadableStream`** with **`credentials: "include"`** so cookie session auth matches normal API calls.
- **Conversation list** polling on `/messaging` uses the **idle** interval only (**45s** from `messagingRoutes.conversations.pollingInterval`), not the former 8s “active” interval — SSE carries realtime updates when Redis fan-out is enabled.
- If **`response.body`** is unavailable (some React Native environments), the SSE hook no-ops; **45s polling** remains the fallback for the conversation list.

## Fan-out and workers

- **Multi-worker / multi-instance:** Without Redis, each worker only sees its own subscribers; enable **`REDIS_URL`** (or reuse **`CELERY_URL`**) so `send_message` / `mark_messages_as_read` publishes after commit and all workers deliver events.
- **Gunicorn:** Default **sync** workers block one request per worker; long-lived SSE ties up workers. Prefer **`gevent` / `eventlet`** workers for multiplexing idle streams, or **`gthread`** with enough **`--threads`**. Validate DB driver compatibility with monkey-patching before choosing gevent/eventlet.

## Reverse proxy

- Flask sets **`X-Accel-Buffering: no`** on the stream response.
- **Nginx (example):** `proxy_http_version 1.1`, `proxy_set_header Connection ''`, **`proxy_buffering off`**, `proxy_cache off`, long **`proxy_read_timeout`** (e.g. 3600s). Match equivalent settings on **ALB / CloudFront** if applicable.

## Capacity

- Each open stream is a long-lived TCP connection; raise **`ulimit -n`** / container **nofile** on app and proxy hosts for expected concurrent messaging users.

## Reconnect

- The client reconnects with exponential backoff (cap 60s).

## Server env

- **`REDIS_URL`:** preferred dedicated URL for messaging pub/sub (optional logical DB index can be added later if you isolate Celery keyspace).
- **`CELERY_URL`:** used as fallback when **`REDIS_URL`** is unset so existing Celery deployments get fan-out without a new variable.
