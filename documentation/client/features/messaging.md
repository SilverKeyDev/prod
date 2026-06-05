# Messaging feature

> **Status:** Shipped for buyer/seller/agent (agent–client stack) and brokerage/integrator/admin (workspace stack)  
> **Last verified:** 2026-06-04  
> **Code:** `Client/packages/features/messaging/`, `Server/app/routes/conversations/`, `Server/app/routes/agent/` (legacy chats)

Unified messaging across two stacks:

| Stack | Personas | API |
| ----- | -------- | --- |
| Agent–client | buyer, seller, agent | `/api/v1/agent/chats/*` |
| Workspace | brokerage, integrator, admin support | `/api/v1/conversations/*` |

Workspace personas share `WorkspaceMessagingShell`, persona configs, and hooks under `hooks/data/workspace/`. Eligible contacts power new thread creation for brokerage↔agent and integrator↔brokerage threads.

## Architecture

- Persona matrix: [messaging-persona-variations.md](../architecture/messaging-persona-variations.md)
- Workspace API: [messaging-workspace-conversations.md](../../server/messaging-workspace-conversations.md)
- SSE: [messaging-sse.md](../../server/messaging-sse.md)

## Ops

Runbook: [documentation/internal/messaging-sse-operations.md](../../internal/messaging-sse-operations.md).

## Related

- [transactions/collaboration/](../../transactions/collaboration/)
