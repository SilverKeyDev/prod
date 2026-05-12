## Inspections and Due Diligence

### Problem / goal

The **inspection and due diligence phase** is critical and heavily deadline-driven. We need to:
- Model inspection windows, re-inspections, and repair request deadlines.
- Allow for state- and contract-specific variation.
- Align checklist content, milestones, and calendar events.

### Data model & invariants

- Inputs:
  - `contract_acceptance_date` (or effective date).
  - Contract default inspection period.
  - `jurisdiction_ruleset_key`.

- Milestones:
  - `inspection_window_start`
  - `inspection_window_end`
  - Optional:
    - `repair_request_deadline`

- Checklist items:
  - Derived from templates such as `INSURANCE_ITEMS` (used for inspection/due diligence tasks).

Invariants:
- For transactions with inspection contingencies:
  - There is at least an `inspection_window_end` milestone.
  - Checklist items clearly indicate:
    - Which actions are recommended.
    - Which actions are time-critical.

### Flows / UX

1. **Inspection window calculation**
   - On entering contract details:
     - Engine computes:
       - Start/end of inspection window.
       - Optional repair request cutoff.

2. **Checklist guidance**
   - Buyer sees:
     - Steps such as:
       - Hire a general inspector.
       - Order specialized inspections as needed.
       - Review disclosures vs inspection results.
     - Clear indication of:
       - How many days remain in the window.
   - Agent sees:
     - The same list, plus:
       - Tools to record negotiations or repair requests.

3. **State-by-state variation**
   - Some states/contracts:
     - Define specific lengths and mechanics for inspection contingencies.
   - `JurisdictionRuleSet`:
     - Encodes defaults and allows customizing windows and deadlines by jurisdiction.

### Existing infrastructure to reuse / extend

- **Checklist templates**
  - `INSURANCE_ITEMS` (`Server/app/services/transactions/insurance/items.py`):
    - Already include inspection and due diligence-oriented tasks.

- **Close checklists UI**
  - Existing Inspections tab and subcomponents:
    - `Client/packages/features/checklists/components/subheaders/InspectionsDueDiligence.tsx`.

- **Deadline engine**
  - Should create milestones for `inspection_window_end` and related deadlines.

### Gaps that require new work

- **Deadline rules per jurisdiction**
  - Encode inspection period defaults and variants in `JurisdictionRuleSet`.

- **More granular checklist metadata**
  - Mark which inspection tasks:
    - Are “must-do” vs “nice-to-have.”
    - Are time-critical vs informational.

- **Calendar and notifications**
  - Calendar events and notifications for:
    - Upcoming inspection window end.
    - Repair request deadlines.
