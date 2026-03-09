## Review Workflows and Approvals

### Problem / goal

Some steps in a transaction require not only completion but also **explicit review or approval** by a specific role (e.g. agent, TC, broker).  
We need to define:
- How review requirements are encoded.
- How reviews are requested, performed, and recorded.
- How review outcomes affect checklist completion and notifications.

### Data model & invariants

- **ChecklistItemState**
  - `review_required_role` (optional)
  - `review_state`:
    - `not_required`
    - `pending`
    - `approved`
    - `changes_requested`
  - `last_reviewed_by_participant_id` (optional)
  - `last_reviewed_at` (optional)

- **ReviewRecord** (optional explicit model)
  - `id`
  - `transaction_id`
  - `checklist_item_state_id` or `agreement_id`
  - `reviewer_participant_id`
  - `outcome` (`approved`, `changes_requested`)
  - `comment` (optional)
  - `created_at`

Invariants:
- Only participants whose role matches `review_required_role` (or a superset) may:
  - Change `review_state`.
- Checklist items with `completion_type = signature_plus_review`:
  - Are only considered fully complete when `review_state = approved`.

### Flows / UX

1. **Review requirement definition**
   - Checklist templates specify:
     - Which items need review.
     - Which role is responsible (e.g. `agent`, `transaction_coordinator`, `broker`).

2. **Review requests**
   - When an item reaches a trigger state (e.g. a document is uploaded or agreement is signed):
     - System sets `review_state = pending`.
     - Emits a `NotificationEvent` targeting the relevant role(s).

3. **Performing reviews**
   - Reviewers see:
     - A “Needs review” queue (view/filter in checklists and/or documents UI).
   - For each item:
     - They can mark:
       - Approved.
       - Changes requested (optionally with comments).
   - Result:
     - `review_state` updated.
     - Checklist completion and downstream events (e.g. milestones) updated as appropriate.

4. **Reconciling multiple reviews (optional v2)**
   - For advanced workflows:
     - Items may require multiple approvals (e.g. both agent and broker).
   - This can be modeled by:
     - Multiple `ReviewRecord` entries with aggregation logic.

### Existing infrastructure to reuse / extend

- **Checklist UI**
  - Existing checklist UIs and components:
    - `CloseLayout`, subheaders, and `ChecklistCheckbox`.
  - Can be extended with:
    - Badges indicating review-required and review status.
    - Actions for reviewers to approve/request changes.

- **Documents/agreements UI**
  - Document detail views for agreements and reports:
    - Natural place to show “Review and approve” controls.

- **Notifications**
  - Reuse the notification infrastructure:
    - To notify reviewers of pending items.
    - To notify other participants when critical items are approved or need changes.

### Gaps that require new work

- **Review API**
  - Endpoints to:
    - Request review explicitly (if needed).
    - Record review outcomes and comments.
    - Query items by `review_state` and required role.

- **Permission enforcement**
  - Ensure that:
    - Only authorized roles can adjust review state.
    - Review changes are fully audited (who, when, what changed).

- **UI surfaces for reviewers**
  - “Review” queue or filter in:
    - Checklists views.
    - Documents views.
  - Clear feedback for:
    - What is waiting on them.
    - What changed as a result of their decision.

