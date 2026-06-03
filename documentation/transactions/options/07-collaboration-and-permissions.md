> **Status:** Partial — agent↔client checklist access only; transaction RBAC not built.  
> **Last verified:** 2026-05-28

## Problem

Multiple roles per deal (buyer, agent, TC, LO, escrow) need predictable, testable permissions across checklists, calendar, and documents.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Model | **Option A** — transaction-scoped RBAC via `TransactionParticipant` + role→capability maps. |
| ABAC (**Option B**) | Deferred. |
| Per-feature hard-coded checks (**Option C**) | Rejected as long-term foundation. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Global roles | Agent vs client on `User`; route decorators. | `Server/app/utils/common_patterns.py` (`require_agent_access`, `require_authenticated_user`) |
| Checklist access | Agent may read/write client checklist if client id ∈ `get_agent_client_ids`. | `Server/app/routes/transactions.py`, `Server/app/services/agent/client_service.py` |
| Client UI | Agent hub passes `checklistSubjectUserId`; integration slot gets `transactionSubjectId`. | `Client/packages/features/checklists/hooks/data/useChecklistData.ts`, `components/slots/ChecklistIntegrationSlot.tsx` |
| Messaging | Agent/client threads (not transaction-participant graph). | `Client/packages/features/messaging/` |
| Participants | **No** `TransactionParticipant`, **no** `RoleTemplate` tables or APIs. | — |

## Gaps

- Invite/list participants, per-role capability matrix, assign checklist items to participants.
- Activity feed per transaction (see `documentation/transactions/collaboration/` — mostly spec).

## Implementation note

Frontend should consume capability flags from the API when RBAC lands; avoid duplicating role matrices in components.
