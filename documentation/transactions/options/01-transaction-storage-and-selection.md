> **Status:** Partial — buyer-scoped checklists shipped; multi-`Transaction` entity and active pointer not wired.  
> **Last verified:** 2026-05-28

## Problem

Represent multiple concurrent deals per user, resolve an **active transaction** for checklists/calendar/docs, and avoid a parallel transactions-only UX.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Multi-transaction requirement | Reject single global active transaction only (**Option A**). |
| Default model | **Option B** — many transactions per user; buyers get an `active_transaction_id`; agents pick per client context. |
| Per-surface-only selection (**Option C**) | Rejected — too much friction. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Checklist scope | `transaction_id` in `/api/v1/transactions/<id>/tasks` is the **buyer user id** (self or agent’s managed client). | `Server/app/routes/transactions.py` (`_can_read_transaction_task_checklist`), `Client/packages/features/checklists/hooks/data/useChecklistData.ts` (`checklistSubjectUserId`) |
| Progress storage | `TransactionTask` rows keyed by `user_id` + `category` (`user_tasks` table). | `Server/app/models/transactions/transaction_task.py`, `Server/app/services/transactions/unified_task_checklist_*.py` |
| `Transaction` row | Minimal model (`buyer_id`, `primary_agent_id`, `skyslope_file_id`); used for agreement links, not checklist routing. | `Server/app/models/transactions/transaction.py`, `Server/app/routes/checklist_documents.py` |
| Client surfaces | Close/roadmap checklists, agent hub prefetch. | `Client/packages/features/checklists/components/layout/CloseLayout.tsx`, `Client/packages/features/checklists/components/roadmap/`, `Client/packages/features/agent/hooks/data/clientHub/useClientHubChecklistPrefetch.ts` |
| Workspace shells | Buyer/seller/brokerage placeholders. | `Client/packages/features/workspace/` |

## Gaps (Option B not finished)

- No `active_transaction_id` on buyer profile; no transaction switcher.
- No `TransactionParticipant` or per-deal participant graph.
- No `POST /api/v1/transactions` that creates a deal row and binds address + checklists to `transactions.id`.

## Rejected options (summary)

- **Option A** — one active deal globally: fails multi-transaction product requirement.
- **Option C** — pick transaction on every surface: rejected for UX and deep links.
