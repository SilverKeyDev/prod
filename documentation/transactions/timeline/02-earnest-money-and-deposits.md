> **Status:** Partial | **Last verified:** 2026-05-28

## Earnest money and deposits

Earnest-money guidance lives in **escrow checklist content** and optional calendar reminders—not computed `earnest_money_due` milestones or payment rails.

### Shipped

- Escrow checklist items (deposit, wire instructions, receipt confirmation) in `escrow/items.py`.
- Relative-day calendar events when buyer checks off items with `calendar.eventSchedule` (e.g. wire in N days).
- Manual checkbox completion; document upload for proof-of-wire via documents library.

### Gaps

- No `JurisdictionRuleSet` deadline from contract acceptance date.
- No Plaid/ACH integration for sending or confirming funds.

### Code pointers

| Area | Path |
| ---- | ---- |
| Escrow items | `Server/app/services/transactions/escrow/items.py` |
| Escrow UI | `Client/packages/features/checklists/components/subheaders/EscrowLegalLogistics.tsx` |
| Calendar on checkoff | `Server/app/services/transactions/calendar_from_checklist.py` |
| Wire form | `closing/items.py` — item 3 references `wire_instructions` form |
