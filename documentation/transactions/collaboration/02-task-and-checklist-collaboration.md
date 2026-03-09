## Task and Checklist Collaboration

### Problem / goal

Checklists should function as a **shared plan of record** for all participants in a transaction. We need to define:
- How tasks are **assigned** to participants.
- Who can mark tasks **done**, **reviewed**, or **blocked**.
- How to prevent conflicting or confusing updates when multiple parties interact with the same checklist.

### Data model & invariants

- **ChecklistItemState** (per transaction)
  - `status` (todo, in_progress, done, blocked)
  - `assigned_to_participant_id` (optional)
  - `review_required_role` (optional)
  - `review_state` (not_required, pending, approved, changes_requested)
  - `last_updated_by_participant_id`
  - Optional:
    - `notes` or `activity` references for comments.

Invariants:
- For a given checklist item and transaction:
  - There is **one canonical status** and one optional assigned participant.
  - Review state is role-aware:
    - Only participants with matching roles can mark as reviewed.

### Flows / UX

1. **Assignment**
   - Agent (or another privileged role) can:
     - Assign items to participants (buyer, TC, loan officer, etc.).
   - Assignees see:
     - Their assigned items highlighted.
     - Optional filtered views (“My tasks”).

2. **Completion and updates**
   - Assignee or authorized participants can:
     - Mark items as done or in-progress.
   - For items with signature or integration semantics:
     - Status may be controlled by:
       - Agreement signatures.
       - Integration tasks.
     - Manual completion may be restricted or require confirmation.

3. **Review**
   - Items that require review:
     - Show a “Review required” state for the relevant role (e.g. agent, TC).
   - Reviewers can:
     - Approve (moving item to done if other conditions met).
     - Request changes (potentially re-opening tasks or triggering additional steps).

4. **Conflict prevention**
   - When multiple participants attempt to update the same item:
     - Server applies last-write-wins with:
       - Clear audit trail (who changed what).
       - Notifications if a change conflicts with expectations.

### Existing infrastructure to reuse / extend

- **Checklist UI**
  - `Client/packages/features/checklists/components/CloseLayout.tsx` and:
    - `ChecklistCheckbox` (`Client/packages/ui/components/form/ChecklistCheckbox.tsx`).
  - Already render checklist items and track checked state using:
    - `useChecklistData` hook to get `items` and `checkedIds`.

- **Checklist API**
  - `Server/app/routes/tasks.py` and:
    - `Client/packages/features/checklists/api/checklists.ts`, `useChecklistData`.
  - These should be evolved:
    - From `checkedIds` to richer `itemStates` including assignment and review state.

- **Store and UI state**
  - Any existing store/state that:
    - Tracks user identity and role in the client (e.g. `useAuthStore`).
  - This should be used to:
    - Determine what actions are available per participant.

### Gaps that require new work

- **Assignment and review API**
  - New endpoints or extensions to existing ones to:
    - Set `assigned_to_participant_id`.
    - Update `status` and `review_state` with proper permission checks.

- **UI affordances**
  - UX patterns for:
    - Assigning tasks (dropdowns or bulk assignment).
    - Filtering by assignee.
    - Showing review-required status and actions.

- **Activity feed integration**
  - For every significant checklist update:
    - Emit an event into the transaction activity feed (see `07-audit-trail-and-activity-feed.md`).

