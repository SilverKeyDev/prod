## Document and Agreement Collaboration

### Problem / goal

Documents and agreements (**DocuSign** agreements and **S3**-stored files) must be:
- Shared across all relevant participants in a transaction.
- Governed by role-based permissions for viewing, uploading, sending, and voiding.
- Linked to checklists, milestones, and notifications.

### Data model & invariants

- **Agreement** and **AgreementParticipant** (existing)
  - Represent the core agreement and its signers/recipients.

- **DocumentLink / AgreementLink**
  - Connects documents/agreements to:
    - Checklists.
    - Milestones.
    - Transactions.

Invariants:
- Each document/agreement belongs to **exactly one transaction** (or a clearly defined set of linked transactions for rare cases).
- Visibility follows:
  - Transaction participation.
  - Role-specific permissions (e.g. lender may see only loan-related documents).

### Flows / UX

1. **Shared document library per transaction**
   - A unified view in the transaction “Documents” area shows:
     - All agreements.
     - Supporting documents (reports, receipts, disclosures, etc.).
   - Filters:
     - By type (agreement, report, proof of funds, etc.).
     - By status (draft, sent, signed, archived).

2. **Role-based actions**
   - Agent:
     - Can upload documents.
     - Attach templates or files and send for signature via **DocuSign**.
     - Archive or void agreements (subject to signing provider rules).
   - Buyer:
     - Can view their agreements and certain supporting documents.
     - May upload buyer-provided docs (e.g. proof of funds) if role template allows.
   - TC, loan officer, escrow:
     - See and act on documents according to their roles (e.g. upload title commitments, loan disclosures).

3. **Linking to checklists and milestones**
   - From a checklist item or milestone:
     - Users can view and open linked documents/agreements.
   - From a document/agreement:
     - Users can see which checklist item(s) or milestone(s) it fulfills.

4. **Versioning and revisions**
   - For agreements that go through multiple revisions:
     - Use existing `AgreementRevision` model.
     - Ensure links always know which revision is current vs historical.

### Existing infrastructure to reuse / extend

- **Documents and agreements backend**
  - `Server/app/models/documents/*`:
    - `Agreement`, `AgreementParticipant`, `AgreementRevision`, `Document`, etc.
  - `Server/app/services/documents/document_service.py` and related S3 helpers:
    - Handle storage, listing, and deletion for PDFs and JSON.

- **Document/Agreement UI**
  - `Client/packages/features/documents/*`:
    - Components for listing, viewing, and managing agreements and reports.
  - These should be:
    - Extended with transaction context and linking.
    - The primary surface for collaboration around documents, rather than building a new UI from scratch.

### Gaps that require new work

- **Transaction-aware querying**
  - APIs that fetch documents/agreements scoped by `transaction_id`, including:
    - Linked checklist/milestone context.

- **Role-controlled operations**
  - Permission checks and UI affordances for:
    - Uploading.
    - Deleting or archiving.
    - Sending for signature.
    - Sharing externally (e.g. sharing a read-only link with a lender).

- **Link visualization**
  - UI patterns to show:
    - Which checklist items a document satisfies.
    - Which milestones it is associated with.
  - Navigation paths:
    - From checklist/milestone to documents and back.
