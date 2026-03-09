## Title, Escrow, and Closing Preparation

### Problem / goal

Title and escrow processes are essential to:
- Confirming clear ownership.
- Preparing accurate settlement figures.
- Ensuring funds and documents are in place for closing.

We need to:
- Represent key title/escrow milestones.
- Coordinate related checklist items and documents.
- Accommodate differences between:
  - Attorney states.
  - Escrow/title company states.

### Data model & invariants

- Inputs:
  - Whether the transaction is:
    - Attorney-closed.
    - Escrow/title-closed.
  - `jurisdiction_ruleset_key`.

- Milestones:
  - `title_commitment_delivered`
  - `title_objection_deadline`
  - `title_cure_deadline`
  - `final_settlement_statement_ready`

- Checklist items:
  - Examples:
    - “Open escrow and send contract to title company/attorney.”
    - “Review title commitment and exceptions.”
    - “Resolve title issues (liens, encumbrances).”
    - “Confirm wire instructions and closing funds.”

Invariants:
- For each transaction requiring title work:
  - Milestones should reflect:
    - When commitment is expected.
    - When objections and cures must be completed.

### Flows / UX

1. **Opening title/escrow**
   - Once the contract is executed:
     - Agent or TC:
       - Sends contract to title/escrow.
   - Checklist tracks:
     - Confirmation that file is opened.

2. **Title commitment and objections**
   - When commitment is issued:
     - Milestone `title_commitment_delivered` is set.
   - Deadline engine:
     - Computes `title_objection_deadline` and `title_cure_deadline`.
   - Checklist items prompt:
     - Review of commitment.
     - Objection letters where needed.

3. **Closing prep**
   - Steps include:
     - Preparing final settlement or closing disclosure.
     - Confirming wire instructions.
   - Milestones track:
     - When final figures are expected and delivered.

### Existing infrastructure to reuse / extend

- **Escrow checklist templates**
  - `Server/app/services/transactions/escrow/items.py`:
    - Contains many of the relevant steps already.

- **Documents service**
  - Existing S3-backed report/documents storage:
    - Can be used for title commitments and settlement statements.

- **Compliance rules**
  - Any existing code for:
    - Deadlines tied to disclosures or settlement documents.
  - Should be incorporated into `JurisdictionRuleSet` rather than duplicated.

### Gaps that require new work

- **Detailed milestone logic per jurisdiction**
  - Some states/contracts:
    - Have explicit timelines for title objections/cures.
  - This must be captured in `JurisdictionRuleSet`.

- **Integration with title/escrow providers (future)**
  - Potential APIs for:
    - Pulling commitment statuses.
    - Confirming readiness to close.

