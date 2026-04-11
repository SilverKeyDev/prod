## Option: Checklist Modeling (Templates vs Materialized Tasks)

This document compares approaches for representing transaction checklists in storage and APIs.

### Problem

We need a data model that:
- Preserves rich **template content** (labels, explanations, bullets, resources).
- Tracks **per-transaction progress**, assignments, and review state.
- Scales across many transactions and supports location- and integration-aware behavior.

We must also decide how to evolve from the current `TransactionTask` (`user_tasks`) model.

### Existing infrastructure to check

- Template definitions:
  - `Server/app/services/transactions/escrow/items.py`
  - `Server/app/services/transactions/financing/items.py`
  - `Server/app/services/transactions/closing/items.py`
  - `Server/app/services/transactions/insurance/items.py`
- Unified checklist API:
  - `Server/app/routes/tasks.py` (`GET/PUT /api/v1/tasks`).
- Progress storage:
  - `Server/app/models/transactions/transaction_task.py` (user+category rows).
- Client consumption:
  - `Client/packages/features/checklists/api/checklists.ts`
  - `Client/packages/features/checklists/hooks/data/useChecklistData.ts`

We should reuse templates and route shapes where possible, while adding a **transaction dimension** and richer item state.

---

### Option A – Template + derived state (thin state layer)

**Idea:** Keep templates as code/data and store only **item state** per transaction:
- Templates remain arrays in Python (with added metadata).
- State table stores:
  - `transaction_id`, `template_id`, `status`, `assigned_to`, `review_state`, etc.

- **Pros**
  - Minimal duplication of content; templates stay DRY.
  - Easy to evolve templates (fix copy, add bullets) without migrating rows.
  - Good fit for a “content as configuration” approach.
- **Cons**
  - Must be careful when:
    - Templates are added/removed; state rows with orphaned `template_id` need graceful handling.
  - Certain per-instance customizations (e.g. user-edited labels) are harder (but not required for v1).

**Implementation sketch**
- Continue to store templates in `items.py`, adding metadata as needed.
- Introduce a `ChecklistItemState` table keyed by `(transaction_id, template_id, category)`.
- For read:
  - API loads templates, then overlays state from `ChecklistItemState`.
- For write:
  - API writes changes only to `ChecklistItemState`, never to templates.

---

### Option B – Materialized task rows per transaction (thick instance layer)

**Idea:** For each template item and transaction, create a fully materialized “task” row with all text and metadata copied.

- **Pros**
  - Each transaction has a **frozen view** of checklist content at creation time.
  - Easy to add per-instance customizations (edit label, add notes).
  - Closer to some legacy uses of `TransactionTask`.
- **Cons**
  - More storage cost and complexity.
  - Harder to roll out copy improvements globally; need migration or recomputation.
  - Increased risk of divergence between template and instance content.

**Implementation sketch**
- Extend or replace `TransactionTask` to:
  - Include `transaction_id`, `category`, full text fields, and state.
- At transaction creation, materialize rows for all relevant template items.
- APIs operate on materialized rows only.

---

### Option C – Hybrid: template + materialized metadata

**Idea:** Keep core content in templates but materialize certain per-transaction metadata when needed.

- **Pros**
  - Balance between DRY templates and flexible per-instance fields (e.g. notes, dynamic deadlines).
  - Avoids copying large amounts of static text into every instance.
- **Cons**
  - Adds complexity: need clear rules about which fields live where.
  - Can be confusing for future maintainers if not well documented.

---

### Considerations with `TransactionTask` (user_tasks)

`TransactionTask` currently works as a **user+category progress tracker**, with:
- `user_id`, `category`, `status`, `order_index`, `task_metadata` (including `templateId`).

Options:
- Keep `TransactionTask` as a **legacy bridge**:
  - Continue to use it only for the existing, non-transactional close experience.
  - Build a new transaction-aware model alongside it.
- Evolve `TransactionTask` into the new state table:
  - Add `transaction_id`.
  - Enforce that tasks are always tied to both transaction and template.

The evolution strategy should be chosen during implementation, guided by data volume and migration constraints.

---

### Recommended approach

Start with **Option A (template + derived state)** with a clear path to a hybrid if needed:

- **Why**
  - Aligns with existing template definitions in `items.py`.
  - Minimizes schema churn and storage duplication.
  - Encourages a strong separation between:
    - Content (templates).
    - Progress and collaboration (state).

- **Practical steps**
  1. Add metadata to server-side templates (completion type, integration key, jurisdiction hooks).
  2. Create a `ChecklistItemState` table keyed by `(transaction_id, category, template_id)`.
  3. Update checklist APIs to:
     - Load templates via existing helpers.
     - Overlay state from `ChecklistItemState`.
  4. Define a migration/bridge story for existing `TransactionTask` data:
     - Either gradually map it into the new state table.
     - Or keep it for legacy screens only while new transaction-aware screens use the new model.

This keeps the system flexible, maintainable, and aligned with the rest of the transaction documentation plan.

---

### Agent-scoped brokerage platform integrations (e.g. Dotloop)

If we integrate **third-party brokerage transaction platforms** (e.g. **Dotloop**), our app acts purely as an **agent-scoped integration**, not as a replacement transaction system:

- **Who connects what**
  - A **licensed agent** logs into SilverKey and explicitly connects their vendor account.
  - We never connect at a whole-brokerage level; all vendor API calls are scoped to the authenticated agent.

- **What we pull**
  - For a connected agent, we may pull:
    - Their **checklists** and **forms/packages** from that vendor.
    - Status and completion information for those items where the vendor exposes it.
  - Data is always associated with:
    - `transaction_id` in our system.
    - `external_integration_key` (e.g. `dotloop`).
    - The specific **agent user** who authorized the integration.

- **How it surfaces to clients**
  - Buyers/clients never authenticate directly with the brokerage platform inside our product.
  - Instead, SilverKey:
    - Uses the agent’s integration to **display the agent’s official checklists and forms** alongside our own educational checklist items.
    - May mark certain items as **integration-backed** (see `mechanics/03-checklist-generation.md`) where completion comes from the external platform.

- **Scope and intent**
  - This model keeps:
    - Compliance and “official” brokerage records in the vendor system.
    - Client-facing education, progress views, and reminders in SilverKey.
  - Our transaction data model must therefore:
    - Treat vendor artifacts as **per-agent, per-transaction attachments**, not global templates.
    - Store stable references (`external_id`, `integration_key`) so we can safely sync and display only the **agent’s own** checklists and forms to their clients.

**Note:** **Documents and e-sign** for SilverKey agreements are **DocuSign + S3** (see `integrations/09-documents-docusign-and-s3.md`), not a generic brokerage-platform mirror.
