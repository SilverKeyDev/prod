## Scope and Non-Goals

### Problem we are solving

Enable buyers and agents to **fully manage a real estate transaction through checklists**, with:
- **Multiple concurrent transactions** per user (e.g. multiple properties or deals in different stages).
- A **strict, canonicalized property address** as the gateway into each transaction.
- Checklists that are **tailored by location and transaction facts** (e.g. flood insurance, homestead rules).
- A **single source of truth** for:
  - Checklist items and progress.
  - Milestones and deadlines (inspection window, financing contingency, closing, etc.).
  - Calendar events.
  - Documents and agreements (**DocuSign** for e-sign and templates; **S3** for file storage; optional **FMLS** / **eXp API** form catalogs where configured).
  - Completion rules (signed, reviewed, integration-completed).
- **Shared visibility** between buyer, agent, and other participants (TC, loan officer, etc.).

### In-scope (v1 vision)

- **Transactions as first-class objects**:
  - A user (buyer) can have more than one active transaction.
  - Each transaction is anchored on a **canonical property address** (Google Places-style selection, not free text).
  - Each transaction has its own checklists, milestones, events, and documents.

- **Checklist-centric process management**:
  - Checklists generated from templates (escrow, inspections, financing, closing, move-in).
  - Items adjusted based on **location enrichment** (e.g. flood zones, state rules) and transaction details.
  - Items can be:
    - Basic checkboxes.
    - **Signature-driven** (completion requires a specific agreement to be signed).
    - **Signature + agent-review** (completion requires both signature and role-specific review).
    - **Integration-backed** (e.g. HomeConcierge, future loans/Plaid).

- **Calendar and documents integration**:
  - Milestones appear as calendar events, tied back to the underlying checklist items.
  - Events and checklist items link to **documents/agreements** (DocuSign-backed agreements and S3-stored files).

- **Agent + multi-party collaboration**:
  - Multiple roles per transaction (buyer, agent, TC, loan officer, escrow, etc.).
  - Role-based permissions for seeing and updating tasks, docs, and deadlines.
  - Agent-only flows for **template/form selection** (e.g. DocuSign templates, optional FMLS/eXp catalogs); buyers see attached forms, not the full agent library.

- **Integrations (v1 and future)**:
  - **E-sign and agreement storage**: **DocuSign** (envelopes, templates, webhooks) and **S3** (revisions, signed PDFs, uploads). See `integrations/09-documents-docusign-and-s3.md`.
  - **Optional form catalogs**: **FMLS** and/or **eXp API** where product configuration requires brokerage-specific forms outside DocuSign templates.
  - **`SignatureProvider`** (`Server/app/services/signature/base.py`) remains the provider-agnostic hook; production signing is implemented via **DocuSign** services.
  - **HomeConcierge** as a v1 integration:
    - Optional checklist item or section (e.g. in closing/move-in).
    - Initiation and completion signals that can update checklist state.
  - Clear structural hooks for **financial integrations** (loans, Plaid/earnest money) even if implemented later.

- **Timeline and compliance hooks**:
  - Internal engine for computing deadlines (inspection windows, earnest money due, financing contingency, etc.).
  - A **jurisdiction rule model** that can encode per-state (and sometimes county) variation.
  - Room to incorporate external compliance data sources in the future.

### Non-goals (v1)

- **Full legal/compliance automation**:
  - We do not attempt to be a full legal advice engine or a complete codification of all state-specific real estate law.
  - Instead, we provide **structured hooks** (jurisdiction rule sets, compliance data doc) and rely on curated rules and/or vendor feeds.

- **Brokerage-agnostic forms library**:
  - v1 centers agreements on **DocuSign + S3**; optional **FMLS** / **eXp** catalogs may supplement templates. Supporting every brokerage and every forms provider is out of scope. We design an **extensible integration model** instead.

- **Non-residential transactions**:
  - v1 focuses on **residential purchase** workflows; rentals, commercial, and highly bespoke transactions are out of scope.

- **Rewriting all existing surfaces**:
  - We will not throw away current checklists, calendar, or documents features.
  - The plan explicitly favors **extending existing infrastructure** where feasible (routes, models, hooks, components).

### Existing infrastructure to reuse / extend

- **Checklists / tasks**
  - `Server/app/routes/tasks.py` – unified checklist API (`/api/v1/tasks?type=escrow|financing|closing|insurance`) returning items and `checkedIds`.
  - `Server/app/services/transactions/*/items.py` – current checklist item templates (escrow, financing, closing, insurance/inspections).
  - `Server/app/models/transactions/transaction_task.py` – `TransactionTask` model (today scoped to `user_id + category`).
  - `Client/packages/features/checklists/api/checklists.ts` and `useChecklistData` hook – React Query integration on the client.

- **Calendar**
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx` – event creation UX.
  - `Client/packages/features/dashboard/components/calendar/*` – dashboard calendar usage and connection prompts.

- **Documents and agreements**
  - `Server/app/models/documents/agreement.py` and `agreement_participant.py` – agreement system-of-record and participants.
  - `Server/app/services/signature/base.py` – `SignatureProvider` abstraction and `NoOpSignatureProvider` when DocuSign is not configured.
  - `Server/app/services/docusign/` – DocuSign integration (see `Server/app/services/docusign/README.md`).
  - `Client/packages/features/documents/*` – agreements list, detail, status UI, and DocuSign-oriented hooks.

Future docs in this folder will call out, for each concern, whether we should **extend**, **migrate**, or **create new** infrastructure.
