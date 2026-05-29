> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Client/packages/features/checklists/`, `Client/packages/features/profile/`, `Client/packages/features/homeauth/`, `Client/packages/features/partners/`, `Client/packages/features/documents/`, `Client/packages/features/workspace/`, `Server/app/routes/transactions.py`, `Server/app/routes/tasks.py`

## User flows

What ships vs what the vision docs describe.

### 1. Start / anchor a deal — **Partial**

| Step | Shipped behavior |
| ---- | ---------------- |
| Enter property address | Offer step **Decide on a home** (`finding_home`); Google Places → `POST /api/v1/transactions/address` |
| Create transaction object | **No** dedicated create flow; address saved on user, not per deal |
| Tailored checklists | Same templates for all users; no jurisdiction filtering yet |
| Land on checklists | Buyer workspace → roadmap / close sections (`CloseLayout`, `BuyerRoadmapChecklistItemCard`) |

**Not shipped:** “+ New transaction”, multi-deal creation, async location enrichment.

### 2. Switch transactions — **Planned**

- **Workspace switcher** toggles buyer / seller / agent — not property/deal list
- Progress is **one journey per buyer user id**; agents switch clients via `checklistSubjectUserId`

### 3. Checklist completion — **Shipped**

| Item type | Behavior |
| --------- | -------- |
| Manual checkbox | `toggleItem` → merge rules → `PUT …/tasks` |
| Submit-gated integrations | Budget, areas, criteria, agent, finding home — complete when profile/onboarding + address rules pass |
| Signature-based | Linked agreement `status === completed` merges into `checkedIds` |
| Move Concierge | Admin partner placement on closing step; embed via `PartnerTransactionIntegration` |
| Agent override | Agent PUT bypasses submit gates when `actor_user_id ≠ subject_user_id` |

**UI:** `ChecklistLayout`, `ChecklistCheckbox`, integration slot, progressive `activeItemIds`.

### 4. Calendar and deadlines — **Partial**

| Shipped | Planned |
| ------- | ------- |
| Relative events on checkoff (`calendar.eventSchedule`) | Contract-acceptance milestone engine |
| Form deadlines from step `calendar` + transaction start (`FormsService.calculate_deadline`) | `GET …/milestones`, overrides, jurisdiction rules |
| In-app `CalendarEvent` rows | Full Google sync tied to transaction milestones |

### 5. Documents and signing — **Shipped**

1. Agent attaches forms / uploads on checklist steps (`checklist_forms`, `checklist_documents`)
2. DocuSign send + webhooks update `Agreement`
3. `AgreementLink` ties agreement to `section.item_id`
4. Signature steps auto-check when agreement completes

**Client:** `Client/packages/features/documents/`; **Server:** `Server/app/services/docusign/`

### 6. Multi-party collaboration — **Partial**

| Shipped | Planned |
| ------- | ------- |
| Buyer + primary agent (messaging, agent client list, agent checklist PUT) | TC, loan officer, escrow invites |
| Agent dispatch automation on checkoff (`checklist_dispatch_automation`) | Role-based review gates, shared activity feed |
| Partner exposure logging (Move Concierge / rev-share) | Full permission matrix per participant |
