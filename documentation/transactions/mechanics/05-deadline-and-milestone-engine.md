## Deadline and Milestone Engine

### Problem / goal

We need a **deterministic rules engine** that converts transaction facts into dated milestones, such as:
- Inspection contingency window end.
- Earnest money due date.
- Financing contingency date.
- Title objection deadlines.
- Closing date and related cutoffs.

These milestones must drive:
- Checklist metadata (e.g. “Due by X”).
- Calendar events.
- Notifications and compliance checks.

### Data model & invariants

- **Inputs**
  - Transaction-level fields:
    - `contract_acceptance_date`
    - `scheduled_closing_date` (if set)
    - `is_cash_purchase` vs `loan_type` and `loan_program`
    - `occupancy_type` (primary, secondary, investment)
    - `jurisdiction_ruleset_key` (from location enrichment)
  - Optional:
    - Contract-specific overrides (if the buyer or agent enters custom timelines).

- **Outputs: Milestone**
  - `id`
  - `transaction_id`
  - `type` (e.g. `inspection_window_end`, `earnest_money_due`, `loan_commitment_due`, `title_objection_deadline`, `closing_date`, etc.)
  - `target_date`
  - `source` (`rule_engine`, `manual_override`, `integration`)
  - Optional:
    - `rule_version` (for auditability).

Invariants:
- For a given transaction and ruleset version, the engine is **pure and repeatable**:
  - Same inputs → same milestone outputs (unless overridden).

### Flows / UX

1. **Initial milestone generation**
   - When a transaction’s key inputs are known (contract acceptance date, jurisdiction, etc.):
     - Engine computes baseline milestones.
   - Buyer/agent can see:
     - A list of key dates.
     - How they relate to checklist items and calendar entries.

2. **Updates and overrides**
   - If key inputs change (e.g. closing date moves):
     - Engine recomputes milestones.
     - System highlights changed dates and surfaces conflicts.
   - For certain milestones:
     - Agent or buyer may manually override (e.g. custom inspection period negotiated).
     - Overrides are stored and flagged as `source = manual_override`.

3. **Downstream usage**
   - Checklists:
     - Items show “Due by X”, where X is the linked milestone’s `target_date`.
   - Calendar:
     - Milestones create calendar events, with links back to transaction and checklists.
   - Notifications:
     - Deadline proximity triggers reminder and escalation notifications.

### Existing infrastructure to reuse / extend

- **Date utilities**
  - `Client/packages/utils/date`:
    - Utilities like `dateNow`, `dateParseISO`, and `dayjs` helpers.
    - Already used in `CreateEventModal` to handle date/time inputs and calculations.

- **Scheduling / calendar schemas**
  - Any existing scheduling-related schemas under:
    - `Client/packages/schemas/calendar` and `Client/packages/schemas/scheduling` (if present).
  - Calendar UI and event creation patterns:
    - `Client/packages/features/calendar/components/view/CreateEventModal.tsx`
    - `Client/packages/features/calendar/components/view/CalendarHeader.tsx`

- **Checklist metadata**
  - Current `/api/v1/tasks` metadata fields:
    - `deadline` and `date_finished` included in responses from `get_task_checklist`.
  - This shape can be extended to map milestones → per-category metadata.

We should **build the engine as a backend service** and surface milestone results through APIs that existing calendar and checklist UIs can consume.

### Gaps that require new work

- **Backend rules engine module**
  - A dedicated module (e.g. `Server/app/services/transactions/deadlines/engine.py`) that:
    - Accepts transaction facts and a `jurisdiction_ruleset_key`.
    - Returns a list of milestones.
  - Rule sets:
    - Initially codified from internal expertise and brokerage guidance.
    - Versioned so we can track which rules applied to which transaction.

- **Persistence for milestones**
  - A `Milestone` table or equivalent:
    - Allows overrides, audit, and reconciliation with calendar events.

- **Jurisdiction rule sets**
  - Structures that define:
    - Default inspection windows.
    - Earnest money timing.
    - Title and financing-related deadlines.
    - Business days vs calendar days handling.
  - Linked to `jurisdiction_ruleset_key` produced by location enrichment.

- **API surface**
  - Endpoints like:
    - `GET /api/v1/transactions/<transaction_id>/milestones`
    - `PUT /api/v1/transactions/<transaction_id>/milestones/<milestone_id>` for overrides.
  - Shape designed to be consumed by:
    - Checklists (for deadlines).
    - Calendar (for events).
    - Notifications (for upcoming/overdue detection).

