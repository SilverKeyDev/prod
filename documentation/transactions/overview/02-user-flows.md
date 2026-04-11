## User Flows for Checklist-Driven Transactions

This document describes the key end-to-end flows for buyers, agents, and other participants when managing a transaction through checklists.

Each flow includes:
- What the user sees and does.
- What data is created/updated.
- Which existing surfaces should be extended, not replaced.

---

### 1. Start a new transaction from checklists

**Actors:** Buyer (optionally agent-coached)
**Goal:** Start a new transaction by entering an address, then land on tailored checklists.

1. Buyer opens the **Close / Transactions** area (web or mobile).
2. In the header area for checklists, they tap/click a **“+ New transaction”** action.
3. A dialog or screen prompts for a **property address**:
   - Backed by Google Places-style autocomplete.
   - Buyer must pick a **canonical result** (placeId + normalized address); free-text is not allowed to complete this step.
4. Once an address is selected:
   - System creates a new `Transaction` and `PropertyAddress`.
   - System runs **location enrichment** (jurisdiction, flood zone, etc.) asynchronously.
5. Buyer is taken to a **transaction home/checklists view**:
   - Default tab (e.g. escrow or overview) shows tailored checklist items.
   - Progress bar reflects per-transaction checklist completion.

**Existing infrastructure to reuse / extend**
- Use the **existing checklist headers** as the anchor for the “+ New transaction” affordance:
  - `Client/packages/features/checklists/components/ClosePageHeader.tsx`
  - `Client/packages/features/dashboard/components/DashboardChecklists/DashboardChecklistsHeader.tsx`
- Reuse the **maps / address autocomplete patterns** from:
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx` (location suggestions).
  - Any existing search/address input components.
- Extend, rather than replace, existing **checklist content components**:
  - `Client/packages/features/checklists/components/CloseLayout.tsx`
  - `Client/packages/features/checklists/components/subheaders/*`

---

### 2. Switching between multiple transactions

**Actors:** Buyer, Agent
**Goal:** Move between different active transactions for the same user.

1. From any **transaction-aware view** (checklists, calendar, docs), the user can open a **transaction switcher**:
   - Likely in the same header area as the “+ New transaction” button.
2. The switcher shows:
   - Address and high-level status for each transaction.
   - Possibly key dates (offer accepted, closing date) or progress summary.
3. Selecting a transaction:
   - Updates all transaction-scoped surfaces (checklists, calendar, docs) to that `transaction_id`.
4. The concept of **“active transaction”** is per-user and per-role, not global:
   - Buyer may have a different active transaction than an agent who represents multiple clients.

**Existing infrastructure to reuse / extend**
- Wherever we currently scope close checklists to “current user,” re-scope to **(user, active_transaction)** instead:
  - `useChecklistData` and the `/api/v1/tasks` endpoint should be transaction-aware.
- Use existing layout containers for **dashboard sections**:
  - `Client/packages/features/dashboard/components/ClientHub/checklists/ClientChecklists.tsx`
  - `Client/packages/features/dashboard/components/ClientHub/checklists/ClientChecklists.native.tsx`
  - Add a transaction context/provider instead of building a separate feature silo.

---

### 3. Checklist use and completion (manual + signature + review)

**Actors:** Buyer (primary), Agent (reviewer), other roles (viewers/assignees)
**Goal:** Use checklists to track progress and drive the transaction forward.

1. Buyer views checklist categories (escrow, inspections, financing, closing, move-in).
2. For each item:
   - Manual items can be checked off directly.
   - Signature-based items:
     - Are associated with one or more **agreements** (e.g. buyer rep, purchase contract, addenda).
     - Are marked complete when the linked agreement(s) reach a target status (e.g. `signed` or `completed`).
   - Signature + review items:
     - Require both a completed agreement and a **specific role** (e.g. agent, TC) to mark as reviewed.
3. Agents can:
   - See all buyer progress.
   - Mark review-required items as reviewed or needing changes.
   - Add comments or notes (future extension).

**Existing infrastructure to reuse / extend**
- Keep the **current checklist display components**:
  - `CloseLayout` + `ChecklistCheckbox` in `Client/packages/ui/components/form/ChecklistCheckbox.tsx`.
- Extend **API responses** from `/api/v1/tasks` to include:
  - Template metadata (whether an item is signature-, review-, or integration-based).
  - Transaction-aware state.
- Use the existing **agreements/document system** to back signature-based completion:
  - `Server/app/models/documents/agreement.py`
  - `Client/packages/features/documents/types/agreements.ts`

---

### 4. Calendar and deadlines

**Actors:** Buyer, Agent
**Goal:** View transaction milestones and related events on the calendar.

1. When a transaction is created and enriched, the **deadline engine** computes milestone dates:
   - Inspection window end, earnest money due, title objections deadlines, financing contingency, closing date, etc.
2. Each milestone:
   - Is optionally rendered as one or more calendar events for the buyer and/or agent.
   - Links back to its checklist item (where applicable).
3. Users can:
   - View these events in the in-app transaction calendar.
   - Optionally sync to their **Google Calendar** (if connected).

**Existing infrastructure to reuse / extend**
- Build on current calendar UX:
  - `Client/packages/features/calendar/components/view/CalendarHeader.tsx`
  - `CreateEventModal` and calendar data hooks.
- Reuse existing **Google Calendar connection flows**:
  - `Client/packages/features/dashboard/components/calendar/components/CalendarConnectionPrompt.tsx`
- Introduce transaction context to event creation/fetching instead of a separate calendar module.

---

### 5. Documents, DocuSign templates, S3 files, and signing flows

**Actors:** Agent, Buyer, other parties (as signers/recipients)
**Goal:** Agents attach the right agreements and files, send for signature via **DocuSign**, store artifacts in **S3**, and checklist items mark complete when done.

1. Agent views the transaction’s **documents/agreements** section.
2. From there, the agent:
   - Selects **DocuSign templates** (synced per product setup) and/or uploads supporting files (stored in **S3** where applicable).
   - Optionally uses **FMLS** / **eXp**-sourced forms when those integrations are configured.
3. For each attached agreement:
   - An `Agreement` is created or linked.
   - A checklist item is associated with that agreement.
4. Sending for signature:
   - Uses **DocuSign** (OAuth per agent, envelopes, embedded signing as configured).
   - **Connect** webhooks and/or polling update agreement status; completed PDFs land in **S3**.
   - Status changes (sent, delivered, signed, completed) drive checklist completion and notifications.

**Existing infrastructure to reuse / extend**
- Agreement models and DocuSign fields:
  - `Server/app/models/documents/agreement.py` and `agreement_participant.py`.
- Signature provider abstraction and DocuSign services:
  - `Server/app/services/signature/base.py` (`SignatureProvider`, `NoOpSignatureProvider`).
  - `Server/app/services/docusign/` — see `Server/app/services/docusign/README.md`.
- Documents UI:
  - `Client/packages/features/documents/*`, including `AgreementListItem`, `AgreementCard`, and `AgreementDetailModal`.
- Signature hooks:
  - `Client/packages/features/documents/hooks/data/useDocusignAgreement.ts`, `useDocusignActions.ts`, and related DocuSign hooks for signing state and actions.

---

### 6. Multi-party collaboration (agent, TC, loan officer, etc.)

**Actors:** Buyer, Agent, TC, Loan Officer, others
**Goal:** Treat each transaction as a **shared workspace** with role-based visibility and capabilities.

1. Transaction owner (typically buyer + primary agent) can invite other parties:
   - Transaction coordinator.
   - Loan officer.
   - Escrow/title contacts.
2. Each participant role:
   - Has a default permission set (can view X, edit Y, review Z).
   - May be assigned specific checklist items or milestones.
3. Assignment and ownership:
   - Checklist items can be assigned to a participant.
   - Certain items require a specific role to mark “reviewed”.
4. All parties see:
   - The same canonical list of steps and their status.
   - Activity feed / audit trail of who did what when.

**Existing infrastructure to reuse / extend**
- User and agent models:
  - `Server/app/models/user/user.py` and agent-related models.
- Any existing **client collaboration** surfaces (e.g. messaging, documents sharing) under:
  - `Client/packages/features/messaging/*`
  - `Client/packages/features/dashboard/components/ClientHub/*`
- Notifications foundation:
  - `documentation/to-implement-soon/notifications/*` for email/push design patterns.

Further details for collaboration live in `collaboration/*.md`.
