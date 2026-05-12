## Overall Transaction Timeline

### Problem / goal

We need a clear, high-level picture of:
- The main phases of a residential purchase transaction.
- How those phases map to:
  - Checklist categories (escrow, inspections, financing, closing, move-in).
  - Milestones and deadlines.
  - Calendar events and notifications.

This serves as the **narrative backbone** for the more detailed phase docs in this folder.

### Phases and mapping

1. **Contract execution**
   - Key dates:
     - Offer acceptance date.
     - Effective date (as defined in the local contract form).
   - Checklist categories:
     - Escrow/legal logistics.
   - Milestones:
     - Earnest money due.
     - Deadline to deliver initial disclosures.

2. **Due diligence and inspections**
   - Key dates:
     - Inspection contingency window start/end.
   - Checklist categories:
     - Inspections / insurance / due diligence.
   - Milestones:
     - Inspection period end.
     - Repair request deadline (if specified).

3. **Financing and appraisal**
   - Key dates:
     - Loan application submission.
     - Appraisal order and completion.
     - Financing contingency date.
   - Checklist categories:
     - Financing and insurance.
   - Milestones:
     - Loan commitment due.
     - Appraisal contingency end (if separate).

4. **Title, escrow, and closing prep**
   - Key dates:
     - Title commitment delivered.
     - Objection and cure deadlines.
     - Final figures / settlement statements.
   - Checklist categories:
     - Escrow/legal logistics and closing/move-in.
   - Milestones:
     - Title objection deadline.
     - Deadline to clear conditions.

5. **Signing, funding, and closing**
   - Key dates:
     - Closing date/time.
     - Funding date (sometimes same day, sometimes later).
   - Checklist categories:
     - Closing/move-in.
   - Milestones:
     - Signing appointment.
     - Recording and funding complete.

6. **Move-in and post-closing**
   - Key dates:
     - Possession date (keys handed over).
     - Deadlines for homestead filings and other local benefits.
   - Checklist categories:
     - Closing/move-in (maintenance, address updates, homestead, etc.).
   - Milestones:
     - Move-in date.
     - Homestead filing deadline (where applicable).

### Existing infrastructure to reuse / extend

- **Checklist categories**
  - Existing categories used in checklists:
    - Escrow, inspections (insurance), financing, closing/move-in.
  - Already represented in:
    - `Server/app/services/transactions/*/items.py` and client-side mappings.

- **Calendar and milestones**
  - Calendar UI and hooks (see `integrations/06-calendar-and-document-linking.md`).
  - Deadline engine (see `mechanics/05-deadline-and-milestone-engine.md`) should:
    - Populate milestones aligned with these phases.

### Gaps that require new work

- **Detailed phase rules**
  - The subsequent docs (`02`–`08` in this folder) must:
    - Define default and jurisdiction-specific timelines per phase.
    - Tie them explicitly to concrete milestones and checklist items.

- **Phase-aware UX**
  - Transaction overview screens may:
    - Show progress by phase.
    - Surface “What’s next” and “What’s at risk” across all phases.
