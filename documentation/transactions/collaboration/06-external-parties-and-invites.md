## External Parties and Invites

### Problem / goal

Transactions often involve **external parties** who may not be full SilverKey users, such as:
- Transaction coordinators.
- Loan officers.
- Escrow/title officers.
- Attorneys and other advisors.

We need a way to:
- Invite these parties into the transaction workspace.
- Control their access and capabilities.
- Handle onboarding, offboarding, and role changes safely.

### Data model & invariants

- **TransactionParticipant**
  - Can represent:
    - Internal users (with `user_id`).
    - External-only participants (with `email`/`name` and `user_id = null` initially).

- **Invite**
  - `id`
  - `transaction_id`
  - `email`
  - `intended_role` (e.g. `transaction_coordinator`, `loan_officer`)
  - `status` (`pending`, `accepted`, `expired`, `revoked`)
  - `token` or secure invite code
  - `created_at`, `expires_at`

Invariants:
- Each invite is:
  - Bound to a specific transaction and intended role.
  - Time-limited and revocable.

### Flows / UX

1. **Inviting external parties**
   - Agent (or another privileged role) opens:
     - “Invite participant” in the transaction UI.
   - Fills:
     - Email.
     - Role (TC, loan officer, escrow, etc.).
   - System:
     - Creates an `Invite` record.
     - Sends an email with an invite link.

2. **Accepting invites**
   - Invitee clicks the link:
     - If they already have a SilverKey account:
       - They are linked as `TransactionParticipant` with the chosen role.
     - If they do not:
       - They are guided through lightweight onboarding, after which:
         - A `TransactionParticipant` record is created.

3. **Access and deactivation**
   - Agents can:
     - Change roles for participants.
     - Disable access (e.g. after closing or if a vendor is replaced).
   - Inactive participants:
     - Should no longer receive notifications.
     - Remain in the audit trail for historical events.

4. **Visibility for external parties**
   - External roles see:
     - Views scoped to their responsibilities:
       - TC: checklist, documents, deadlines.
       - Loan officer: financing-related tasks/documents/milestones.
       - Escrow: title and closing-related tasks/milestones/documents.

### Existing infrastructure to reuse / extend

- **User accounts and auth**
  - Existing user model and authentication flows:
    - Should be reused for external parties where possible, avoiding a separate “external user” system.

- **Any existing invite/share flows**
  - Check for features where:
    - Agents can share reports or links with clients/partners.
  - New invite flows should:
    - Follow the same email and security practices.

- **Email delivery**
  - Reuse the email sending infrastructure:
    - Templates for invites.
    - Link tracking and security.

### Gaps that require new work

- **Invite model and endpoints**
  - APIs to:
    - Create, resend, revoke invites.
    - Accept invites and tie them to user accounts.

- **Role-specific onboarding**
  - UX paths tailored for:
    - TC, loan officer, escrow, etc.
  - Should collect just enough information to:
    - Create a meaningful `TransactionParticipant`.

- **Permissions and lifecycle**
  - Clear rules for:
    - What happens to tasks, docs, and events when a participant’s access is revoked.
    - How changes are communicated to other participants.
