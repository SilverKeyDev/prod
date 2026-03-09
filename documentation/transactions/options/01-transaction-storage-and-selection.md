## Option: Transaction Storage and Selection

This document compares approaches for modeling and selecting transactions for a user.

### Problem

We need a way to:
- Represent **multiple concurrent transactions** per user.
- Efficiently look up **“active transaction”** for a given context (buyer, agent, TC, etc.).
- Scope checklists, milestones, calendar, and documents to the correct transaction.

### Existing infrastructure to check

- Any existing “client” or “buyer” records that may already group data per home search or deal.
- `TransactionTask` (`Server/app/models/transactions/transaction_task.py`) and `/api/v1/tasks`:
  - Today implicitly scoped by `user_id + category` (no transaction dimension).
- Dashboard and checklists views:
  - `Client/packages/features/dashboard/components/ClientHub/checklists/ClientChecklists.tsx`
  - `Client/packages/features/checklists/components/CloseLayout.tsx`

We should **extend** these surfaces rather than introducing a parallel “transactions-only” UX.

---

### Option A – Single active transaction per user (global)

**Idea:** Each user has at most one active transaction; everything else is historical.

- **Pros**
  - Simplest mental model and UI.
  - Minimal changes to data structures; could store `active_transaction_id` on `User`.
  - Slightly easier to integrate with existing checklist API (just swap category storage).
- **Cons**
  - Does not meet the requirement for **multiple concurrent transactions** (e.g. investor buyers, multiple offers).
  - Forces unnatural “archiving” or switching behavior when a second deal starts.

**Conclusion:** Not acceptable given the multi-transaction requirement.

---

### Option B – Multiple transactions, per-user active transaction pointer

**Idea:** A user can have many transactions, but for each user we track a **single “active transaction” pointer** per role/context.

- **Pros**
  - Supports concurrency while still giving UI a simple default (open app → see active transaction).
  - Active pointer can be stored cheaply (e.g. on User or in a small `UserActiveTransaction` table).
  - Checklists/calendar/docs can default to the active transaction but allow switching.
- **Cons**
  - Must define semantics when:
    - No active transaction exists yet.
    - A transaction completes (auto-switch? require explicit user action?).
  - Need to handle multi-role scenarios (e.g. an agent’s “active transaction with Client A” vs with Client B).

**Implementation notes**
- For **buyers**:
  - Store a simple `active_transaction_id` on the user profile.
  - On transaction creation, if none exists, set it.
  - Allow explicit switching in the UI.
- For **agents and other roles**:
  - Use per-session or per-view selection (e.g. a transaction picker on dashboards filtered by client).
  - Avoid a global agent-wide “active transaction”; scope by **client context**.

**Recommendation:** **Adopt Option B** as the default model.

---

### Option C – Per-surface transaction selection only (no active pointer)

**Idea:** The system does not track an “active” transaction; every view requires the user to pick a transaction explicitly.

- **Pros**
  - Simple storage; no need for an active pointer.
  - No hidden state that can drift or confuse users.
- **Cons**
  - Worse UX:
    - Users would be forced to pick a transaction every time they open checklists, calendar, or docs.
  - Harder to implement deep-links that assume an implicit active transaction.

**Conclusion:** Not recommended; UX friction outweighs storage simplicity.

---

### Recommended approach

Adopt **Option B**:

- **Data model**
  - `Transaction` table keyed by `id`, linked to buyers and agents.
  - `TransactionParticipant` for multi-party roles.
  - Simple `active_transaction_id` pointer per buyer (and optionally per agent+client relationship).

- **UX**
  - Buyer:
    - When they create their first transaction, it becomes active automatically.
    - A transaction switcher is available in checklist and calendar headers.
  - Agent:
    - Views filtered through a **client context**; within that context, can choose which transaction is active.

- **Migration**
  - Start by:
    - Defining `Transaction` and `TransactionParticipant`.
    - Adding a basic “active transaction” pointer for buyers only.
  - Later:
    - Extend to more nuanced agent-specific active contexts if needed.

