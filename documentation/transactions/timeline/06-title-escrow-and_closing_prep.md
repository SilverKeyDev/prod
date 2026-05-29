> **Status:** Partial | **Last verified:** 2026-05-28

## Title, escrow, and closing preparation

Title/escrow steps are **escrow + closing checklist items** plus document upload/signing—not title-company API integration or objection-deadline engine.

### Shipped

- Escrow items: open escrow, review title commitment, resolve liens, confirm wire instructions.
- Closing items: review settlement docs, send closing funds, final walkthrough.
- Title/commitment PDFs via documents library and checklist form send (DocuSign/messaging).

### Gaps

- No `title_objection_deadline` / `title_cure_deadline` milestones from jurisdiction rules.
- No title/escrow provider status API.

### Code pointers

| Area | Path |
| ---- | ---- |
| Escrow items | `Server/app/services/transactions/escrow/items.py` |
| Closing prep items | `Server/app/services/transactions/closing/items.py` |
| Escrow UI | `Client/packages/features/checklists/components/subheaders/EscrowLegalLogistics.tsx` |
| Closing UI | `Client/packages/features/checklists/components/subheaders/ClosingMovingIn.tsx` |
| Form send | `Server/app/routes/checklist_forms.py` |
