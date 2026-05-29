> **Status:** Partial | **Last verified:** 2026-05-28

## Financing and loan approval

Financing timeline is **checklist-guided** (choose lender, submit application, lock rate, review disclosures). Contingency dates and lender status are not computed or synced.

### Shipped

- `financing/items.py` — application, documentation, rate lock, loan estimate / closing disclosure review.
- Signature-based completion for some disclosure steps via DocuSign + checklist integration.
- Better and other partners may surface via **brokerage marketplace placement** (checklist/admin config)—not per-buyer lender referral.

### Gaps

- No `financing_contingency_end`, `conditional_approval`, or `clear_to_close` milestones.
- No lender webhook/poll integration.

### Code pointers

| Area | Path |
| ---- | ---- |
| Financing items | `Server/app/services/transactions/financing/items.py` |
| UI | `Client/packages/features/checklists/components/subheaders/FinancingInsurance.tsx` |
| Signature → checklist | `Server/app/services/transactions/checklist_signature_completion.py` |
| Partner placement (RESPA) | `Client/packages/features/partners/components/PartnerTransactionIntegration.tsx` |
