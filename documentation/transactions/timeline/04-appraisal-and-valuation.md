## Appraisal and Valuation

### Problem / goal

For financed purchases, **appraisal and valuation** steps impact:
- Financing contingencies.
- Renegotiation opportunities.
- Closing feasibility and timing.

We need to:
- Represent appraisal-related milestones.
- Capture how they interact with financing and inspection phases.

### Data model & invariants

- Inputs:
  - `loan_type` and `loan_program`.
  - Whether an appraisal is required (some cash or special cases may skip).

- Milestones:
  - `appraisal_ordered`
  - `appraisal_completed`
  - `appraisal_contingency_end` (if separate from general financing contingency).

- Checklist items:
  - Tasks such as:
    - “Order appraisal.”
    - “Review appraisal report with agent/lender.”
    - “Consider renegotiation or repair credits if appraisal is low.”

Invariants:
- If financing requires an appraisal:
  - There must be at least `appraisal_completed` milestone.
  - Checklist items align with those dates and statuses.

### Flows / UX

1. **Appraisal ordering**
   - Loan officer or agent triggers:
     - “Order appraisal” step once contract and lender are chosen.
   - System may:
     - Record ordering time.
     - Track status updates from lender or appraisal management company.

2. **Results and implications**
   - When appraisal completes:
     - Result details may not be fully stored (to avoid sensitive data) but high-level flags (e.g. low vs at/above contract) may be.
   - Checklist and timeline:
     - Reflect whether further negotiation or re-inspection is recommended.

3. **Jurisdiction and program differences**
   - Some loan programs:
     - Have program-specific expectations for appraisal timing and conditions.
   - Rule sets can:
     - Distinguish general financing deadlines from appraisal-specific windows when needed.

### Existing infrastructure to reuse / extend

- **Financing checklist templates**
  - Items in `Server/app/services/transactions/financing/items.py`:
    - Likely already include appraisal-related content.

- **Financing UI**
  - Financing tab and related components in:
    - `Client/packages/features/checklists/components/subheaders/FinancingInsurance.tsx`.

- **Deadline engine**
  - Should compute/track:
    - Appraisal-related milestones where relevant.

### Gaps that require new work

- **Appraisal-specific milestones**
  - Explicit milestone types and rule entries for:
    - Ordering, completion, and any contingency cutoffs.

- **Integration with lender systems (future)**
  - Hooks for:
    - Receiving status updates.
    - Reflecting those in checklists and notifications.

