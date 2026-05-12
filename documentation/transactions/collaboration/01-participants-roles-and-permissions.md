## Participants, Roles, and Permissions

### Problem / goal

Each transaction should act as a **multi-party workspace** where:
- Different participants (buyer, agent, TC, loan officer, etc.) can see and act on the same transaction.
- Permissions are clear and predictable.
- Future integrations (e.g. lender portals, escrow tools) can plug into the same model.

### Data model & invariants

- **TransactionParticipant**
  - `id`
  - `transaction_id`
  - `user_id` (nullable for external-only participants)
  - `role` (e.g. `buyer`, `agent`, `transaction_coordinator`, `loan_officer`, `escrow_officer`, `seller_side_agent`, etc.)
  - Optional:
    - `email`, `name` for external parties without a SilverKey account.

- **RoleTemplate**
  - Defines default permissions per role:
    - Capabilities like:
      - `can_view_checklists`
      - `can_edit_checklists`
      - `can_initiate_signing`
      - `can_review_documents`
      - `can_invite_participants`

- **Permission overrides (optional v2)**
  - Per-participant overrides that adjust role templates for special cases.

Invariants:
- Each transaction has at least:
  - One `buyer` participant.
  - One `agent` (where applicable).
- Permissions are enforced consistently across:
  - Checklists.
  - Calendar.
  - Documents and agreements.
  - Notifications and activity feeds.

### Flows / UX

1. **Participant onboarding**
   - When a transaction is created:
     - Buyer is automatically added as a `buyer` participant.
     - Primary agent is added as `agent` (if known).
   - Additional participants (TC, loan officer, etc.) can be invited later.

2. **Role-based views and actions**
   - Buyer:
     - Sees full checklist and calendar view for their transaction.
     - Limited ability to alter structural aspects (e.g. cannot delete milestones).
   - Agent:
     - Can manage checklists, attach forms, send for signature, invite other roles.
   - TC, loan officer, escrow:
     - Role-specific visibility and editing rights per role template.

3. **Role and permission changes**
   - Agents (and possibly admins) can:
     - Reassign roles (e.g. change primary agent).
     - Deactivate participants (e.g. remove a TC after closing).
   - Changes are recorded in the audit trail.

### Existing infrastructure to reuse / extend

- **User and agent models**
  - `Server/app/models/user/user.py` and agent-related models:
    - Provide identity and role context at the global level.

- **Client hub and existing collaboration features**
  - `Client/packages/features/dashboard/components/ClientHub/*`:
    - Already organize client-centric views, including:
      - Checklists.
      - Agreements.
      - Messaging.
  - These should be extended with a transaction participant model instead of introducing separate “transaction-only” user models.

- **Authentication and authorization**
  - Any existing auth/role checks (e.g. “is_agent”, “is_client”) should:
    - Be extended to accept **transaction-scoped roles** where necessary, not replaced.

### Gaps that require new work

- **TransactionParticipant model and APIs**
  - Back-end support for:
    - Listing participants by transaction.
    - Adding/removing participants.
    - Updating roles.

- **RoleTemplate definitions**
  - A central configuration for:
    - What each role can do in a transaction.
  - May live as:
    - Config files or code constants with unit tests.

- **Permission checks**
  - Application of role templates and overrides in:
    - Checklist APIs.
    - Calendar APIs.
    - Document and signing endpoints.
    - Invite and activity-feed endpoints.
