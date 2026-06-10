> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [workspace.md](../../client/features/workspace.md).

## External parties and invites

**Buyer ↔ agent connection** is shipped via connection requests. Inviting TC, loan officers, escrow, or other transaction participants is **not**.

### Shipped

- **Connection requests:** Buyer initiates or accepts agent outreach; server auto-accepts inbound client→agent requests for agents.
- **Agent directory:** Search/recommended agents; connect from messaging header and profile flows.
- **Messaging unlock:** Chat requires an accepted connection (or existing conversation).

### Gaps

- No `Invite` model, email invite links, or `TransactionParticipant` for external roles.
- No role-specific onboarding for TC/lender/escrow.

### Code pointers

| Area | Path |
| ---- | ---- |
| Connection requests hook | `Client/packages/features/agent/hooks/data/connections/useConnectionRequests.ts` |
| Inbox UI | `Client/packages/features/agent/components/modals/inbox/ConnectionRequestsInbox.tsx` |
| Messaging sidebar | `Client/packages/features/messaging/components/layout/chrome/UnifiedMessagingSidebar.tsx` |
| Agent search row | `Client/packages/features/agent/components/search/AgentDirectoryRow.tsx` |
| Server routes | `Server/app/routes/agent/agent.py` — `/connection-requests` |
| Connection service | `Server/app/services/agent/connection_request_service.py` |
