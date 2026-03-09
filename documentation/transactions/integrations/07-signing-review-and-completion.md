## Signing, Review, and Checklist Completion

### Problem / goal

We want checklist items and milestones to reflect **real agreement progress**, not just manual checkboxes, by:
- Driving completion from **agreement signature status**.
- Optionally requiring **agent (or role-based) review** for certain items.
- Supporting future **integration-completed** signals (e.g. from HomeConcierge or financial providers).

### Data model & invariants

- **Agreement** (existing)
  - `Server/app/models/documents/agreement.py`:
    - `id`, `status`, `title`, `agreement_type`, `buyer_id`, `agent_id`, `property_address`, and DocuSign-era fields.
  - `AgreementParticipant`:
    - `id`, `agreement_id`, `user_id`, `email`, `name`, `role`, `recipient_status`, and signature timestamps.

- **AgreementLink** (new linkage concept)
  - `id`
  - `transaction_id`
  - `agreement_id`
  - `linked_item_type` (e.g. `checklist_item`, `milestone`)
  - `linked_item_id`

- **ChecklistItemState** (see domain model)
  - `status` (todo, in_progress, done, blocked)
  - `completion_type` (manual, signature_based, signature_plus_review, integration_based)
  - `review_required_role` (optional)
  - `review_state` (not_required, pending, approved, changes_requested)

Invariants:
- For `signature_based` items, **only agreement status** (and not manual ticking) should control completion, unless a specific override path is defined.
- For `signature_plus_review` items, both:
  - Agreement status is terminal (signed/completed).
  - A participant with the correct role has recorded a review outcome.

### Flows / UX

1. **Attaching forms and creating agreements**
   - Agent uses the documents UI to:
     - Choose forms/templates (via SkySlope; see dedicated doc).
     - Create one or more `Agreement` records linked to a `Transaction`.
   - System creates `AgreementLink` entries and associates them with the correct checklist items/milestones.

2. **Sending for signature**
   - Agent initiates signing via:
     - `SignatureProvider` (SkySlope-backed in v1).
   - Relevant checklist items move to `in_progress`.

3. **Signature status updates**
   - When agreements move to statuses like `sent`, `delivered`, `signed`, `completed`:
     - Webhooks or polls update the `Agreement` records.
     - Checklist engine:
       - Updates `ChecklistItemState` for linked items.
       - Marks `status = done` when conditions are met (for signature-based items).

4. **Review workflows**
   - For items with `completion_type = signature_plus_review`:
     - Once agreements are signed:
       - The relevant role (e.g. agent, TC) sees a “Review” action.
     - They can mark:
       - Approved.
       - Changes requested (and optionally attach comments).
   - Checklist completion reflects both signature and review state.

5. **Integration-completed signals (future)**
   - For integration-backed items:
     - When the attached `IntegrationTask` reaches `status = completed`:
       - Checklist items may auto-complete or move to a state where only review is pending.

### Existing infrastructure to reuse / extend

- **Signature abstraction**
  - `Server/app/services/signature/base.py`:
    - Defines `SignatureProvider`, `SignatureRequest`, and `SignatureRecipient`.
    - Currently uses `NoOpSignatureProvider` as a stub while migrating to SkySlope.
  - This should be **extended**, not bypassed, to support SkySlope:
    - Preserve provider-agnostic interface where possible.

- **Agreement models and APIs**
  - `Server/app/models/documents/agreement.py` and `agreement_participant.py`:
    - Already track status and participants.
  - Any existing routes under `Server/app/routes/documents/*`:
    - These should be extended with transaction context and additional fields needed for checklist links.

- **Client documents and signature UI**
  - `Client/packages/features/documents/hooks/data/useAgreementSignature.ts`:
    - Currently returns a provider-agnostic “unconfigured” status; will be the main hook for signature state.
  - `Client/packages/features/documents/components/*`:
    - `AgreementListItem`, `AgreementCard`, `AgreementDetailModal`, etc.
  - These should be extended with:
    - Transaction-aware context.
    - Review state indicators and actions.

### Gaps that require new work

- **AgreementLink model and API**
  - New model and endpoints to:
    - Link agreements to checklist items and milestones.
    - Retrieve agreements by transaction and by linked item.

- **Checklist completion engine**
  - Logic that:
    - Derives item completion state from agreement status and review state.
    - Runs when:
      - Agreement status changes.
      - Review actions occur.

- **SkySlope-backed SignatureProvider implementation**
  - Concrete implementation of `SignatureProvider` that:
    - Creates SkySlope signing envelopes/transactions.
    - Maps SkySlope statuses into our normalized agreement statuses.
    - Supports URL generation and cancellation.

- **Review UX and APIs**
  - Server:
    - Endpoints to record review outcomes by role, tied to checklist items and/or agreements.
  - Client:
    - UI surfaces near checklist and document detail views to:
      - Request review.
      - Approve or request changes.

