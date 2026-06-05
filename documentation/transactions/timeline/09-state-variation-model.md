> **Status:** Planned | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

## State and jurisdiction variation model

`JurisdictionRuleSet` / `RuleVersion` are **design targets only**. Checklist content is national/generic; deadlines are not computed from state or contract form.

### Current behavior

- Same item templates for all buyers; optional copy mentions state-specific homestead rules in item explanations.
- `transaction_id` routes use buyer user id; address enrichment exists for property context but does not drive timeline rules.

### Planned

- Rulesets keyed by `state_code` (+ optional county) feeding a deadline engine: inspection windows, earnest money, financing/title cutoffs, homestead deadlines.
- Versioned rules with migration policy for in-flight transactions.

### Code pointers

| Area | Path |
| ---- | ---- |
| Checklist taxonomy | `Server/app/services/transactions/checklist_support/checklist_constants.py` |
| Transaction address API | `Server/app/routes/transactions.py` — `TransactionAddress` |
| Homestead copy (manual) | `Server/app/services/transactions/closing/items.py` — item 8 |
| Design refs (not implemented) | `documentation/transactions/mechanics/05-deadline-and-milestone-engine.md` |
