## Implementation Order for Checklist-Driven Transactions

This document provides a **practical build sequence** for taking the transaction-through-checklists vision to production.

Each step includes:
- What to implement.
- Which existing infrastructure to extend first.
- What can be deferred to a later phase.

---

### Phase 1 – Transaction and address foundation

1. **Introduce Transaction + PropertyAddress models**
   - Define server-side models for:
     - `Transaction` (linking buyer, primary agent, status, contract metadata).
     - `PropertyAddress` (normalized address, placeId, lat/lng).
   - Add a simple `POST /api/v1/transactions` endpoint that:
     - Accepts an address payload (canonicalized from the client).
     - Creates `Transaction` + `PropertyAddress` + returns IDs.
   - **Existing infra to check/extend:**
     - Reuse address normalization patterns used in search/calendar where possible.
     - Check for any existing “client hub” or buyer record that should be associated.

2. **Strict address entry UX**
   - On web and mobile, add a **“+ New transaction”** flow in the close/checklists header:
     - Uses Google Places-style autocomplete.
     - Forces the user to pick a canonical result (no arbitrary text).
     - On confirmation, calls `POST /transactions`.
   - **Existing infra to check/extend:**
     - `CreateEventModal` location autocomplete patterns.
     - Close / checklists headers (`ClosePageHeader`, `DashboardChecklistsHeader`).

---

### Phase 2 – Transaction-aware checklists (MVP)

3. **Transaction-scoped checklist read path**
   - Introduce a **transaction-aware checklist endpoint**, e.g.:
     - `GET /api/v1/transactions/<transaction_id>/tasks?type=escrow|inspections|financing|closing`
   - Initially:
     - Reuse `get_checklist_definition` from the existing `/api/v1/tasks` route.
     - Keep progress storage as today (user+category via `TransactionTask`) but scoped to the **active transaction** in memory.
   - **Existing infra to check/extend:**
     - `Server/app/routes/tasks.py` and `get_checklist_definition`.
     - `TransactionTask` (`user_tasks` table) – confirm compatibility with a transaction field or a bridge strategy.

4. **Client-side wiring for transaction-aware checklists**
   - Update `useChecklistData` to accept `transactionId` and call the new route.
   - Thread `transactionId` from:
     - Transaction creation flow.
     - Transaction switcher (per user).
   - Keep UI unchanged where possible:
     - `CloseLayout`, `ChecklistCheckbox`, subheader components.

5. **Transaction switcher**
   - Add a basic **transaction switcher** (dropdown/list) in:
     - Close/checklists pages.
     - Dashboard widgets that render transaction-scoped checklists.
   - Make sure switching transaction updates:
     - `useChecklistData(transactionId, type)`.
     - Any transaction-scoped context (calendar, docs) where already wired.

---

### Phase 3 – Location enrichment and basic deadlines

6. **Location enrichment service**
   - Implement a small server-side service that:
     - Accepts `PropertyAddress` (placeId or normalized form).
     - Derives `jurisdiction` (state, county).
     - Provides hooks to add flood and other risk data later.
   - Write results back to `Transaction` / `PropertyAddress`.

7. **Baseline milestone/deadline engine**
   - Implement a first version of the **deadline engine**:
     - Inputs: contract acceptance date, closing date (if known), jurisdiction.
     - Outputs: inspection window end, earnest money due, financing contingency date, etc.
   - Store milestones per transaction and expose through:
     - `GET /api/v1/transactions/<transaction_id>/milestones`.
   - **Existing infra to check/extend:**
     - Any existing scheduling or calendar schema (`packages/schemas/scheduling` or similar).
     - Date utility helpers in `packages/utils/date`.

8. **Wire milestones into checklists (read-only)**
   - For now, simply display milestone-derived deadlines in checklist metadata (e.g. “Due by X”).
   - Use this as a validation step before full calendar integration.

---

### Phase 4 – Calendar and event linking

9. **In-app calendar view scoped to a transaction**
   - Extend existing calendar routes/hooks to support `transactionId` filters where appropriate.
   - Render milestones for the active transaction as:
     - Non-editable events initially (date comes from the engine).

10. **Google Calendar integration for milestones**
   - Decide which milestones should sync to Google Calendar by default.
   - Use existing:
     - `CreateEventModal`
     - `CalendarHeader` and `CalendarConnectionPrompt`
   - Add transaction context to event creation:
     - Include `transactionId` and `milestoneId` when creating events.

---

### Phase 5 – Documents, SkySlope forms, and signature-driven completion

11. **SkySlope forms integration (agent side)**
   - Implement server-side endpoints to:
     - Authenticate the agent with SkySlope.
     - List available forms/templates for that agent/brokerage.
   - Add an **“Attach form from SkySlope”** flow in the transaction documents UI.
   - **Existing infra to check/extend:**
     - Agreement models and document service in `Server/app/services/documents/`.
     - Client documents UI (`Client/packages/features/documents/*`).

12. **Signature provider wiring (SkySlope)**
   - Replace `NoOpSignatureProvider` with a SkySlope-backed implementation:
     - `create_signature_request`, `get_signature_status`, `get_signing_url`, `cancel_signature`.
   - Add endpoints for the client to:
     - Start signing flows.
     - Poll or receive webhooks for status updates.

13. **Checklist completion from signature status**
   - For items tagged as `signature_based` or `signature_plus_review`:
     - Tie completion to agreement status and (for review) the presence of a review record by the right role.
   - Ensure agreement → checklist linkage is stored via `AgreementLink`.

---

### Phase 6 – HomeConcierge and integration-backed tasks (MVP)

14. **IntegrationTask model and service**
   - Add a generic `IntegrationTask` model for provider-backed actions (HomeConcierge, later loans/Plaid).
   - Minimal v1 fields: `transaction_id`, `provider_key`, `status`, `data`.

15. **HomeConcierge integration as a first provider**
   - Surface an optional **HomeConcierge step** in relevant checklist categories (e.g. move-in).
   - Provide “Start with HomeConcierge” action:
     - Creates an `IntegrationTask` and redirects to HomeConcierge.
   - Handle completion callback (webhook or redirect) and update:
     - Integration task status.
     - Associated checklist item status.

---

### Phase 7 – Collaboration and multi-party access

16. **Transaction participants and roles**
   - Implement `TransactionParticipant` model and role templates:
     - Buyer, Agent, TC, Loan Officer, Escrow, etc.
   - Expose endpoints to:
     - List participants.
     - Invite new participants (email-based or user-based).

17. **Permissions and assignments**
   - Apply a first-pass permission matrix (view/edit/review per role) for:
     - Checklists.
     - Milestones.
     - Documents and agreements.
   - Add ability to assign checklist items to participants.

18. **Audit trail and notifications**
   - Add an activity feed per transaction:
     - “Task X completed by Buyer,” “Agreement Y signed by Buyer,” etc.
   - Connect these events to the existing notification system:
     - Push/email/in-app routing per role and preferences.

---

### Phase 8 – Timeline refinement and state variation

19. **Timeline phase docs → rule implementation**
   - Use `timeline/*` docs to:
     - Encode specific default deadlines and behaviors (inspection windows, earnest money rules, etc.).
   - Implement a `JurisdictionRuleSet` abstraction:
     - Start with 1–2 key states (e.g. home markets) and general rules elsewhere.

20. **Compliance and external data**
   - Evaluate whether any vendor (including SkySlope) exposes structured timing/compliance metadata.
   - If not, rely on:
     - Internal tables + curated content.
   - Keep the compliance API integration as a **future extension**.

---

### Phase 9 – Hardening and production readiness

21. **Observability and error handling**
   - Instrument:
     - Transaction creation, checklist generation, deadline calculation, signing, integrations.
   - Define metrics, logs, and alerting for:
     - Checklist API errors.
     - Deadline engine failures.
     - Signing and integration errors.

22. **Security and permissions review**
   - Validate that:
     - Only authorized roles can see/edit sensitive transaction data.
     - External integrations (SkySlope, HomeConcierge, financial rails) use secure tokens and webhooks.

23. **End-to-end tests and roll-out**
   - Add end-to-end tests for:
     - “New transaction → address → checklists → milestones → docs/signing.”
   - Gate the feature behind a **feature flag** and roll out progressively.

