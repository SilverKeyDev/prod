> **Status:** Partial — Option B API contract locked 2026-06-04; multi-deal UI deferred.  
> **Last verified:** 2026-06-04

## Problem

Represent multiple concurrent deals per user, resolve an **active transaction** for checklists/calendar/docs, and avoid a parallel transactions-only UX.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Multi-transaction requirement | Reject single global active transaction only (**Option A**). |
| Default model | **Option B** — many transactions per user; buyers get an `active_transaction_id`; agents pick per client context. |
| Per-surface-only selection (**Option C**) | Rejected — too much friction. |

## Contract locked (2026-06-04)

| Rule | Detail |
| ---- | ------ |
| Spine id | Path param `transaction_id` and rev-share/agreement fields use **`transactions.id` (UUID)** — never the buyer `users.id`. |
| Buyer entry (pilot) | `GET /api/v1/transactions/me` → active deal + optional address (`TransactionMeData`). |
| Multi-deal backend | `POST /api/v1/transactions`, `GET /api/v1/transactions`, `PUT /api/v1/transactions/me/active`; migration `k6f7a8b9c0d1` drops one-row-per-buyer unique constraint. |
| Pilot frontend | Single-deal path only: `useResolvedTransactionId` + `/transactions/me` — **no deal switcher UI**. |
| Post-pilot UI | Deal switcher calls `PUT .../me/active`; agent per-client deal picker when a buyer has 2+ rows. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Checklist scope | `GET/PUT /api/v1/transactions/<transactions.id>/tasks` | `Server/app/routes/transactions/__init__.py`, `unified_task_checklist_*.py`, `Client/packages/features/checklists/hooks/data/useChecklistData.ts` (`transactionId`) |
| Progress storage | `TransactionTask.transaction_id` + `category` | `Server/app/models/transactions/transaction_task.py` |
| Selection | Active pointer, create, list | `Server/app/services/transactions/selection.py`, `users.active_transaction_id` |
| Address | Per `transactions.id` | `TransactionAddress`, `GET/POST /api/v1/transactions/address` (active deal) |
| Agent clients | `transaction_id` on client list | `Server/app/services/agent/client_service.py` |
| Dispatch settings | `transaction_id` on row; dual-read with legacy `client_user_id` | `checklist_item_dispatch_settings`, `dispatch_settings.py`, `checklist_dispatch_automation.py` |
| Client surfaces | Close/roadmap, agent hub prefetch | `useResolvedTransactionId`, `useClientHubChecklistPrefetch` |
| Workspace shells | Role switcher (buyer/seller/agent) — orthogonal to deal | `Client/packages/features/workspace/` |

## Gaps (post-contract)

- No transaction switcher or `GET /transactions` list UI in pilot.
- No `TransactionParticipant` or per-deal participant graph.
- Seller/brokerage deal surfaces must consume `transactionId` when they ship (do not key on buyer user id).

## Rejected options (summary)

> **Shipped feature docs:** [workspace.md](../../client/features/workspace.md).

- **Option A** — one active deal globally: fails multi-transaction product requirement.
- **Option C** — pick transaction on every surface: rejected for UX and deep links.
