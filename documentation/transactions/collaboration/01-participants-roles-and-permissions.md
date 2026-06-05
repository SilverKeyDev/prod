> **Status:** Planned | **Last verified:** 2026-05-28

> **Shipped feature docs:** [workspace.md](../../client/features/workspace.md).

## Participants, roles, and permissions

Multi-party transaction workspaces (buyer, agent, TC, lender, escrow) with role templates and scoped permissions are **not implemented**. Today access is binary: buyer self-service or agent–client relationship.

### Current model

- **Buyer:** `transaction_id` on checklist routes equals the buyer's `user.id`; buyers read/write their own tasks.
- **Agent:** Agents access a client's checklist when the buyer is in the agent's client list (`get_agent_client_ids`).
- **Global roles:** `user_roles` with `role = "agent"` (via `user_is_agent()`) gates agent routes; no per-transaction roles (TC, loan officer, etc.).

### Planned (not in repo)

- `TransactionParticipant` + `RoleTemplate` with capabilities (`can_edit_checklists`, `can_initiate_signing`, …).
- Permission checks on checklist, calendar, documents, and invite endpoints.

### Code pointers

| Area | Path |
| ---- | ---- |
| Checklist ACL | `Server/app/routes/transactions.py` — `_can_read_transaction_task_checklist` |
| Agent clients | `Server/app/services/agent/client_service.py` |
| Agent API | `Server/app/routes/agent/agent.py` |
| Buyer profile / agent flag | `Client/packages/features/homeauth/types/auth/userProfile.ts` |
| Agent client list UI | `Client/packages/features/agent/components/messaging/screen/MessagingAgentListSubview.native.tsx` |
