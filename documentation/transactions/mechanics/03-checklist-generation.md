## Checklist Generation

This document explains how we generate per-transaction checklists from templates, including:
- How existing server-side checklist definitions are reused.
- How location and transaction facts influence inclusion and wording.
- How integration-backed items (HomeConcierge, financial steps) are represented.

---

### 1. Goals

- Keep **educational content and structure** of existing close checklists.
- Move from **user+category** progress to **transaction-scoped** checklists.
- Allow items to be:
  - Always present.
  - Conditionally present based on location, financing, or other transaction facts.
  - Backed by integrations or signature/approval rules.

---

### 2. Template sources (existing infrastructure)

Current checklist item templates live in:
- `Server/app/services/transactions/escrow/items.py`
- `Server/app/services/transactions/financing/items.py`
- `Server/app/services/transactions/closing/items.py`
- `Server/app/services/transactions/insurance/items.py`

They define arrays like:

```1:18:/Users/jaycewalzer/Desktop/SilverKey/Server/app/services/transactions/insurance/items.py
INSURANCE_ITEMS = [
    {
        "id": 1,
        "label": "Hire a general home inspector",
        "explanation": "Choose a certified inspector to evaluate the home's overall condition and identify potential issues.",
        "bullets": [...],
        "resource": {...},
    },
    ...
]
```

On the API side, we already have a **unified checklist route**:

```60:85:/Users/jaycewalzer/Desktop/SilverKey/Server/app/routes/tasks.py
@tasks_bp.route("", methods=["GET"])
def get_task_checklist(user):
    checklist_type = request.args.get("type", "escrow")
    items = get_checklist_definition(checklist_type)
    checked_ids = _get_checked_ids(user.id, checklist_type)
    metadata = get_series_metadata(checklist_type)
    return jsonify({
        "success": True,
        "data": {
            "items": items,
            "checkedIds": checked_ids,
            "title": metadata.get("title"),
            "subtitle": metadata.get("subtitle"),
            "deadline": metadata.get("deadline"),
            "date_finished": metadata.get("date_finished"),
        },
    })
```

On the client, checklists are consumed via:
- `Client/packages/features/checklists/api/checklists.ts` (`getTaskChecklist`, `updateTaskChecklist`).
- `Client/packages/features/checklists/hooks/data/useChecklistData.ts` (React Query wrapper).

We will **reuse these definitions and routes** as the starting point, then evolve them to be transaction-aware.

---

### 3. Template metadata

To support transaction-aware behavior, we need to enrich templates with metadata (conceptual schema, not necessarily a separate table yet):

- **Completion type**
  - `manual`
  - `signature_based`
  - `signature_plus_review`
  - `integration_based`

- **Integration link (optional)**
  - `integration_key`: e.g. `home_concierge`, `loan_app`, `plaid_earnest`.

- **Jurisdiction behavior**
  - `jurisdiction_ruleset_key`: ID referencing which rule set decides:
    - Whether the item is included.
    - Whether text or bullets change for certain states.

- **Assignments and roles**
  - `default_assigned_role`: buyer, agent, TC, loan_officer, etc.
  - `review_required_role` (for review-based completion).

This metadata can be introduced incrementally:
- Start by **augmenting the existing Python definitions** (e.g. additional keys on each dict).
- Later, if needed, migrate to more structured storage (DB or configuration files).

---

### 4. From templates to per-transaction instances

When a transaction is created (or when its status switches to “under contract”):

1. Determine **which checklist categories** apply:
   - For example: `escrow`, `inspections`, `financing`, `closing`, `move_in`.
2. For each category:
   - Load the corresponding template list (`*_ITEMS`).
   - Apply **jurisdiction rule sets** and transaction facts to:
     - Filter which items apply.
     - Optionally adjust labels/explanations.
3. Materialize a `ChecklistInstance` per category and **optionally** pre-create `ChecklistItemState` rows, or:
   - Lazily create state rows on first interaction, using template IDs as keys.

The choice between pre-materialization and lazy state creation is covered in `options/03-checklist-modeling.md`.

---

### 5. Location and transaction facts

Checklist generation depends on:
- **Address-derived values**:
  - State, county, municipality.
  - Flood zone or similar risk data (where available).
- **Contract facts**:
  - Offer acceptance date, closing date.
  - Cash vs financed; loan type.
  - Occupancy (primary residence vs investment).

The **location enrichment layer** (see `mechanics/04-location-enrichment.md`) is responsible for:
- Attaching derived values to `Transaction` or `PropertyAddress`.
- Providing the `jurisdiction_ruleset_key` and other inputs to the checklist generator.

---

### 6. Integration-backed items (HomeConcierge, loans, Plaid, SkySlope/Dotloop)

Some tasks represent **integration-backed flows** rather than simple checkboxes:

- Example: HomeConcierge
  - Checklist item: “Schedule your move-in concierge session.”
  - Has `integration_key = "home_concierge"`.
  - When the user clicks “Start with HomeConcierge,” an `IntegrationTask` is created.
  - Completion signal (from HomeConcierge) marks the checklist item as done and may record notes.

- Future financial steps:
  - Loans:
    - Items like “Submit loan application,” “Upload documents to lender,” “Receive conditional approval.”
    - Each may have an integration key pointing to a lender integration.
  - Plaid/earnest money:
    - Items like “Send earnest money” backed by ACH/transfer flows.

- Brokerage transaction platforms (SkySlope/Dotloop):
  - Certain compliance or “official paperwork” steps may be represented as items whose **source of truth** lives in SkySlope/Dotloop.
  - Integration behavior is always **agent-scoped**:
    - A licensed agent connects their own SkySlope/Dotloop account inside SilverKey.
    - We call the vendor API on behalf of that agent to pull only **their** checklists/forms for the relevant transaction.
  - Checklist items in SilverKey:
    - Store an `integration_key` such as `"skyslope"` or `"dotloop"` and an `external_id` from the vendor.
    - Can be marked complete when the corresponding item is completed in the external system.
    - Are shown to clients as part of the transaction checklist, but clients never log into SkySlope/Dotloop directly.

The templates themselves only need to know **which integration key** (if any) applies; the integration infrastructure (see `integrations/12-financial-and-service-integrations.md`) handles actual API calls and status updates.

---

### 7. API evolution: from /api/v1/tasks to transaction-aware routes

Today, `/api/v1/tasks` is user+type scoped. For transaction-aware checklists, we need:

- An extended or new route, such as:
  - `/api/v1/transactions/<transaction_id>/tasks?type=escrow|inspections|financing|closing|move_in`
- Response shape:
  - `items`: enriched templates after applying jurisdiction and transaction rules.
  - `checkedIds` or richer `itemStates`:
    - `status`, `assigned_to`, `review_state`, `integration_status`, etc.
  - `metadata`: per-category title, subtitle, deadline, date_finished.

Client hooks like `useChecklistData` should:
- Accept `transactionId` and `checklistType`.
- Use React Query keys like `["transactions", transactionId, "checklists", type]`.

---

### 8. Existing infrastructure to reuse / extend

- **Template definitions**:
  - Continue to use the Python dict-based templates in `Server/app/services/transactions/*/items.py`, adding metadata as needed.

- **Unified checklist API**:
  - Use `Server/app/routes/tasks.py` as the starting point for shape and semantics.
  - Gradually introduce transaction-awareness instead of a completely new controller.

- **Client data hooks and components**:
  - Reuse `useChecklistData` and the existing components in:
    - `Client/packages/features/checklists/components/CloseLayout.tsx`
    - `Client/packages/ui/components/form/ChecklistCheckbox.tsx`
  - Add props/context for `transactionId` and richer item metadata instead of rebuilding the UI.

The design options for storage layout and migration from `TransactionTask` are covered in `options/03-checklist-modeling.md`.

