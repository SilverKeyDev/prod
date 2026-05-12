## Earnest Money and Deposits

### Problem / goal

Earnest money and similar deposits are:
- Time-sensitive.
- Often governed by contract and state-specific norms.

We need to:
- Capture the **inputs** required to compute earnest money deadlines.
- Define how deadlines may vary by jurisdiction/contract form.
- Integrate future **financial rails** (e.g. Plaid) for sending and confirming funds.

### Data model & invariants

- Inputs:
  - `contract_acceptance_date` (or effective date).
  - Contract form defaults (e.g. deposit due within N business/calendar days).
  - Jurisdiction (`jurisdiction_ruleset_key`).

- Milestone:
  - `type = earnest_money_due`
  - `target_date` computed by the deadline engine.

- Checklist items:
  - Items like:
    - “Deliver earnest money to escrow.”
    - “Confirm escrow receipt.”
  - May be:
    - Manual (buyer checks off).
    - Integration-backed (future: ACH/Plaid).

Invariants:
- For each transaction with earnest money:
  - There is at least one `earnest_money_due` milestone.
  - Checklist items reference that milestone for due dates.

### Flows / UX

1. **Configuration and calculation**
   - When contract details are entered:
     - System uses `jurisdiction_ruleset_key` and contract form defaults to set:
       - Earnest money amount (if known).
       - `earnest_money_due` milestone.

2. **Checklist guidance**
   - Buyer sees:
     - Clear instructions about:
       - Where to send funds (escrow/title).
       - Timing requirements and wire safety warnings.
   - Agent sees:
     - The same milestone and can verify completion.

3. **Future integration: sending and confirming**
   - For Plaid or other payment providers:
     - Checklist item “Send earnest money” may:
       - Initiate a transfer.
     - Completion is:
       - Driven by confirmation from the payment provider or escrow.

### Existing infrastructure to reuse / extend

- **Checklist templates**
  - Existing escrow-related checklists under:
    - `Server/app/services/transactions/escrow/items.py`.

- **Deadline engine**
  - `mechanics/05-deadline-and-milestone-engine.md`:
    - Must include logic for computing `earnest_money_due` dates.

- **Documents and receipts**
  - Document service:
    - May already handle file uploads (e.g. proof of wire).
  - This can be used to store:
    - Receipts or confirmations associated with earnest money tasks.

### Gaps that require new work

- **Jurisdiction rule entries**
  - Define defaults per `JurisdictionRuleSet` for:
    - Earnest money deadlines.
    - Business vs calendar days.

- **Financial integration hooks (future)**
  - Abstract interfaces for:
    - Initiating transfers.
    - Confirming receipt.
  - Security and compliance considerations for handling financial data.
