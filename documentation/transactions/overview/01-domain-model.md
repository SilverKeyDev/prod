## Domain Model for Checklist-Driven Transactions

This document defines the core entities and relationships for transaction management through checklists, calendars, documents, and integrations.

### Core entities

- **Transaction**
  - Represents a single real-estate deal for a property.
  - Key fields:
    - `id`
    - `buyer_id` (and optionally co-buyers)
    - `primary_agent_id`
    - `property_address_id`
    - `status` (prospecting, under_contract, closed, cancelled, etc.)
    - `jurisdiction` (state, county, possibly city)
    - `contract_metadata` (acceptance date, close date, financing vs cash, etc.)

- **PropertyAddress**
  - Canonical representation of a property, derived from a strict address selection flow.
  - Key fields:
    - `id`
    - `normalized_address` (single-line)
    - `street`, `city`, `state`, `postal_code`, `country`
    - `lat`, `lng`
    - `place_id` (Google Places or equivalent)

- **TransactionParticipant**
  - A person or organization involved in the transaction.
  - Key fields:
    - `id`
    - `transaction_id`
    - `user_id` (nullable for external parties)
    - `role` (buyer, agent, transaction_coordinator, loan_officer, escrow_officer, seller_side_agent, etc.)
    - `permissions` (derived from role template + overrides)

- **ChecklistTemplate & ChecklistItemTemplate**
  - Templates grouped by category (escrow, inspections, financing, closing, move-in).
  - Item template fields:
    - `id` (template id)
    - `label`, `explanation`, `bullets`, `tips`, `resources`
    - `category` (escrow, inspections, financing, closing, move_in, timeline, etc.)
    - `completion_type` (manual, signature_based, signature_plus_review, integration_based)
    - `integration_key` (optional; e.g. `home_concierge`, `earnest_money`, `loan_app`)
    - `jurisdiction_ruleset_key` (optional; controls inclusion or transforms for certain states)

- **ChecklistInstance & ChecklistItemState**
  - Per-transaction instantiation of a template.
  - `ChecklistInstance`:
    - `id`, `transaction_id`, `category`, `title`, `subtitle`
  - `ChecklistItemState`:
    - `id`, `transaction_id`, `checklist_instance_id`, `template_id`
    - `status` (todo, in_progress, done, blocked)
    - `assigned_to_participant_id` (optional)
    - `review_required_role` (optional)
    - `review_state` (not_required, pending, approved, changes_requested)
    - Links:
      - `milestone_id` (optional)
      - `document_link_ids` (optional)
      - `integration_task_id` (optional)

- **Milestone**
  - Represents a dated obligation (e.g. inspection deadline, earnest money due, financing contingency, closing).
  - Key fields:
    - `id`, `transaction_id`
    - `type` (inspection_window_end, earnest_money_due, loan_commitment_due, closing_date, etc.)
    - `target_date`
    - `source` (rule_engine, manual_override, integration)

- **CalendarEventLink**
  - Links a milestone (or checklist item) to one or more calendar events.
  - Key fields:
    - `id`, `transaction_id`
    - `milestone_id` or `checklist_item_state_id`
    - `external_calendar_id` (e.g. Google calendar ID)
    - `external_event_id`

- **DocumentLink & AgreementLink**
  - Connects checklist items/milestones to documents/agreements.
  - `DocumentLink` fields:
    - `id`, `transaction_id`
    - `document_id` (Server `Document`/report/etc.)
    - `linked_item_type` (checklist_item, milestone)
    - `linked_item_id`
  - `AgreementLink` fields:
    - `id`, `transaction_id`
    - `agreement_id` (Server `Agreement` model)
    - `linked_item_type`, `linked_item_id`

- **IntegrationTask**
  - Encapsulates interactions with external services (HomeConcierge, loans, Plaid/earnest money, etc.).
  - Key fields:
    - `id`, `transaction_id`
    - `provider_key` (e.g. `home_concierge`, `loan_provider_x`, `plaid_earnest`)
    - `status` (not_started, in_progress, completed, failed, cancelled)
    - `data` (provider-specific metadata)

- **NotificationEvent**
  - Structured events that drive notifications (push, email, in-app).
  - Key fields:
    - `id`, `transaction_id`
    - `event_type` (item_completed, document_signed, review_required, deadline_upcoming, etc.)
    - `actor_participant_id`
    - `target_participant_ids`
    - `created_at`, `payload`

### How this relates to current models

#### TransactionTask (user_tasks)

Current model:

```12:23:/Users/jaycewalzer/Desktop/SilverKey/Server/app/models/transactions/transaction_task.py
class TransactionTask(db.Model):
    __tablename__ = "user_tasks"
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="todo")
    due_date = db.Column(db.DateTime, nullable=True)
    order_index = db.Column(db.Integer, nullable=True)
    task_metadata = db.Column("metadata", db.JSON, nullable=True)
```

Today this effectively stores **per-user, per-category checklist progress**, without a transaction dimension. In the new model:

- We treat `TransactionTask` as **legacy/bridge storage** for the existing close checklists.
- New transaction-aware checklists should:
  - Either introduce a **transaction-scoped progress model** (e.g. `ChecklistItemState`), or
  - Extend/reshape `TransactionTask` to add `transaction_id` and stronger template linkage.

The docs in `mechanics/` and `options/03-checklist-modeling.md` will define which path we take.

#### Agreement and participants

```13:38:/Users/jaycewalzer/Desktop/SilverKey/Server/app/models/documents/agreement.py
class Agreement(db.Model):
    __tablename__ = "agreements"
    id = db.Column(db.String(36), primary_key=True)
    status = db.Column(db.String(20), nullable=False, default="draft")
    title = db.Column(db.String(255), nullable=False)
    agent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    buyer_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    property_address = db.Column(db.Text, nullable=True)
    agreement_type = db.Column(db.String(50), nullable=False)
```

Agreements become **linked artifacts** of a transaction:
- We should avoid duplicating “agreement status” in the transaction layer.
- Instead, `AgreementLink` connects checklist items/milestones to existing `Agreement` records and we:
  - Drive completion rules from `Agreement.status` and its participants.
  - Centralize signature provider logic behind `SignatureProvider`.

#### Checklist item templates (server) and client types

Current checklist templates live in:
- `Server/app/services/transactions/escrow/items.py`
- `Server/app/services/transactions/financing/items.py`
- `Server/app/services/transactions/closing/items.py`
- `Server/app/services/transactions/insurance/items.py`

On the client, checklists use:
- `Client/packages/features/checklists/api/checklists.ts`
- `Client/packages/features/checklists/hooks/data/useChecklistData.ts`

For the new transaction model:
- We preserve **template content** (labels, explanations, educational resources).
- We add:
  - Template metadata for completion type, integration links, and jurisdiction-specific behavior.
  - A clear mapping from template to per-transaction instance and state.

### Next steps

Subsequent docs in:
- `overview/02-user-flows.md`
- `mechanics/03-checklist-generation.md`
- `timeline/*`

will expand on how these entities are created, updated, and surfaced in the UI, and where existing infrastructure should be extended versus replaced.
