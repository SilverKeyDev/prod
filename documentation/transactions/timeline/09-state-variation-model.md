## State and Jurisdiction Variation Model

### Problem / goal

Many aspects of the transaction timeline vary by:
- State and sometimes county.
- Contract forms and brokerage practices.

We need a cohesive model for:
- Expressing jurisdiction-specific rules.
- Applying them consistently across:
  - Deadlines.
  - Checklist content.
  - Compliance hooks.

### Data model & invariants

- **JurisdictionRuleSet**
  - `id` (e.g. `us_generic`, `us_or`, `us_tx`, `us_va`)
  - `state_code`
  - Optional `county_code` or equivalent.
  - Rule definitions, such as:
    - Default inspection window length and day-count convention.
    - Default earnest money timelines.
    - Default financing and title deadlines.
    - Homestead filing expectations.

- **RuleVersion**
  - `ruleset_id`
  - `version`
  - `effective_from`, `effective_to` (optional).

Invariants:
- Every transaction is associated with:
  - Exactly one primary `JurisdictionRuleSet`.
  - A specific `RuleVersion` when deadlines are computed.

### Flows / UX (indirect)

1. **Assignment**
   - Location enrichment (see mechanics docs) determines:
     - `state_code`, `county_name`.
   - System chooses:
     - Appropriate `JurisdictionRuleSet` based on this information.

2. **Usage in engines**
   - Deadline engine:
     - Reads `JurisdictionRuleSet` to compute timelines.
   - Checklist generation:
     - Uses `jurisdiction_ruleset_key` to include/exclude or tweak items (e.g. flood or homestead-related steps).

3. **Maintenance and upgrades**
   - When rules change:
     - New `RuleVersion` entries capture updates.
   - Existing transactions:
     - May keep using the version in effect when they were created.
     - Or be re-evaluated under new rules with explicit migration logic.

### Existing infrastructure to reuse / extend

- **Deadline engine and checklist generation**
  - `mechanics/03-checklist-generation.md`
  - `mechanics/05-deadline-and-milestone-engine.md`
  - Both engines should:
    - Consume `JurisdictionRuleSet` instead of hard-coding logic.

- **Location enrichment**
  - `mechanics/04-location-enrichment.md`:
    - Produces `jurisdiction_ruleset_key` as a central hook.

### Gaps that require new work

- **Ruleset definition format**
  - Decide on:
    - Storage format (e.g. JSON/YAML + migrations, or DB tables).
  - Provide:
    - A way for ops/legal to safely propose updates.

- **Testing and validation**
  - Test cases for:
    - Representative transactions in multiple states and counties.
  - Tools to:
    - Visualize the timeline produced by a given ruleset/transaction combination.
