## Financing and Loan Approval

### Problem / goal

Financing is a multi-step process that influences:
- Whether the deal can close.
- When contingencies expire.
- What documents and approvals are required.

We need to:
- Model key financing milestones.
- Align financing tasks and checklists with those milestones.
- Provide hooks for lender integrations in the future.

### Data model & invariants

- Inputs:
  - `loan_type` (conventional, FHA, VA, etc.).
  - `loan_program` details (if known).
  - `jurisdiction_ruleset_key`.

- Milestones:
  - `loan_application_submitted`
  - `conditional_approval_received`
  - `clear_to_close`
  - `financing_contingency_end`

- Checklist items:
  - Tasks like:
    - “Choose a lender and submit loan application.”
    - “Provide requested documentation to lender.”
    - “Lock interest rate.”
    - “Review loan estimate and closing disclosure.”

Invariants:
- For financed transactions:
  - There is at least a `financing_contingency_end` milestone.
  - Checklists communicate what’s required to reach “clear to close.”

### Flows / UX

1. **Loan application**
   - Buyer chooses:
     - A lender.
     - Basic loan program parameters.
   - Checklist guides:
     - Application submission.
     - Document upload tasks.

2. **Conditional approval and conditions tracking**
   - Once lender issues conditional approval:
     - System records a milestone.
     - Checklist surfaces:
       - Conditions to clear (e.g. further documentation, repairs).

3. **Financing contingency**
   - Deadline engine:
     - Computes `financing_contingency_end` based on contract/jurisdiction.
   - Notifications:
     - Warn buyer and agent as the deadline nears.

4. **Clear to close**
   - When lender reports clear to close:
     - Milestone is marked complete.
     - Checklist updates.
     - Calendar and notifications reflect readiness for closing.

### Existing infrastructure to reuse / extend

- **Financing checklist templates**
  - Content in `Server/app/services/transactions/financing/items.py`.

- **UI components**
  - Financing subheader and sections in:
    - `Client/packages/features/checklists/components/subheaders/FinancingInsurance.tsx`.

- **Deadline engine**
  - Should:
    - Use `JurisdictionRuleSet` to drive financing-related deadlines.

### Gaps that require new work

- **Milestone integration with lenders (future)**
  - Abstract interfaces to:
    - Poll or receive push updates about loan status.
  - Mapping of lender statuses to internal milestone states.

- **Condition tracking**
  - Fine-grained modeling of:
    - Loan conditions that must be cleared (optional v2).

