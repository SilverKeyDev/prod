## Compliance Data and External APIs

### Problem / goal

Real estate transaction timing and requirements vary by:
- State and sometimes county.
- Contract form and brokerage practices.

There is **no single universal “deadlines API”** that completely covers:
- Inspection windows.
- Earnest money timing.
- Title objection deadlines.
- Financing contingencies.

We need a strategy to:
- Encode and maintain **our own rules** for deadlines and checklist behavior.
- Stay open to leveraging:
  - Vendor-provided rule feeds (e.g. from SkySlope or others) when/if they emerge.
  - Legal/compliance content providers.

### Data model & invariants

- **JurisdictionRuleSet**
  - `id` (e.g. `us_generic`, `us_or`, `us_tx`, `us_va`, etc.)
  - Scope:
    - `state_code` (required).
    - `county_code` or equivalent (optional).
  - Rules:
    - Defaults for:
      - Inspection periods.
      - Earnest money deadlines.
      - Title and financing timelines.
    - Business vs calendar day handling.

- **RuleVersion**
  - Versioning of rule sets:
    - `ruleset_id`
    - `version`
    - `effective_from`, `effective_to` (optional).

Invariants:
- Every transaction is associated with **one primary `JurisdictionRuleSet`**.
- Deadline and milestone calculations always record which **rule version** they used.

### Flows / UX (indirect)

This document mostly affects **backend behavior and docs**, but the impact for users is:
- Dates and obligations they see in:
  - Checklists.
  - Calendar.
  - Notifications.
are driven by **rules that can vary by jurisdiction**, not hard-coded global defaults.

### Existing infrastructure to reuse / extend

- **Deadline engine**
  - The rules engine described in `mechanics/05-deadline-and-milestone-engine.md`:
    - Should be the consumer of `JurisdictionRuleSet`.

- **Location enrichment**
  - `mechanics/04-location-enrichment.md`:
    - Produces `jurisdiction_ruleset_key` based on address and derived data.

- **Any existing compliance/legal code**
  - Backend modules that already:
    - Encode regulatory thresholds or per-state behavior (if any).
  - These should be:
    - Folded into the new `JurisdictionRuleSet` structure where appropriate.

### Gaps that require new work

- **Authoring and managing rule sets**
  - A format (e.g. JSON/YAML/config) for:
    - Defining per-jurisdiction defaults.
    - Overriding specific aspects for certain states/counties.
  - A process:
    - For non-engineers (e.g. ops/legal) to propose updates.
    - For engineering to review and deploy.

- **Evaluation and safety**
  - Testing:
    - Unit tests to ensure that rule changes produce expected milestones.
  - Observability:
    - Metrics for how often rules are used and for which jurisdictions.

- **Vendor and content provider integration**
  - Survey potential sources:
    - SkySlope APIs (if they eventually surface structured timing/compliance metadata).
    - State-specific forms/vendors that publish timing guidelines in machine-readable form.
  - Strategy:
    - Treat external sources as **advisory feeds**.
    - Use them to update our `JurisdictionRuleSet` tables, not as live, opaque black-box logic.

