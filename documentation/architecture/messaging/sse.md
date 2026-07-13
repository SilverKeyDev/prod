# Messaging SSE (architecture)

> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code:** `Client/packages/features/messaging/`, Server messaging routes

Server-sent events deliver real-time message updates to connected clients. Ops runbook: [messaging-sse-operations.md](../../runbooks/messaging-sse-operations.md).

## Client

- Messaging hooks under `Client/packages/features/messaging/hooks/data/`.
- Thread list and send UI in `components/`.

## Server

- SSE endpoints under `Server/app/routes/` (messaging handlers).
- Auth required on stream connections.

## Related

- [messaging.md](../../features/messaging/messaging.md)
- [messaging-sse-operations.md](../../runbooks/messaging-sse-operations.md)
