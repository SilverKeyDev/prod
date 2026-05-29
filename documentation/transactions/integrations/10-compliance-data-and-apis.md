> **Status:** Planned  
> **Last verified:** 2026-05-28  
> **Code pointers:** Checklist templates `Server/app/services/transactions/*/items.py`; timeline specs `documentation/transactions/timeline/`; no `JurisdictionRuleSet` model in repo yet

## Compliance data and external APIs

### Problem

Inspection windows, earnest money timing, and financing contingencies vary by state, county, and contract form. There is **no single universal deadlines API** SilverKey calls today.

### Shipped today (minimal)

- **Checklist item metadata** encodes step order, conditions, and some `completion_type` values per category (`offer/items.py`, `closing/items.py`, etc.).
- **Location enrichment** (profile/search) supplies address context for product flows; it does **not** yet drive a jurisdiction rules engine.

### Planned: `JurisdictionRuleSet`

Conceptual model (not implemented):

- `id`, `state_code`, optional county, versioned defaults for inspection/earnest/title/financing windows.
- Every transaction references one primary ruleset; milestone/deadline engine records which version was used.

Consumer: deadline engine in `documentation/transactions/mechanics/05-deadline-and-milestone-engine.md`.

### External feeds (strategy)

Treat vendor or compliance APIs as **advisory inputs** to update internal rule tables — not live black-box deadline logic. Survey and ingest into `JurisdictionRuleSet` when the engine lands.

### Related timeline docs

State variation and compliance inputs: `documentation/transactions/timeline/09-state-variation-model.md`, `documentation/transactions/timeline/10-compliance-data-and-apis.md`.
