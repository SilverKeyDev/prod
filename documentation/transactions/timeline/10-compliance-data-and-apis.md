## Compliance Data and Timeline APIs (Timeline Perspective)

### Problem / goal

From a **timeline** standpoint, we need to understand:
- Which events and deadlines have regulatory implications.
- Where external compliance guidance or APIs might inform:
  - Minimum/maximum timeframes.
  - Required disclosures and reporting windows.

This complements the broader compliance strategy described in `integrations/10-compliance-data-and-apis.md`.

### Data model & invariants

- **Compliance-relevant milestones**
  - Certain milestones (e.g. delivery of disclosures, closing reporting deadlines) have:
    - Regulatory requirements for timing.

- **Compliance annotations**
  - Milestones and deadlines may be tagged with:
    - `is_compliance_critical` (boolean).
    - `compliance_reference` (optional URL or identifier into internal/external compliance docs).

Invariants:
- Compliance-critical events:
  - Should be clearly marked and surfaced in:
    - Checklists.
    - Calendar views.
    - Notifications.

### Flows / UX

1. **Compliance-aware timelines**
   - Timeline views can:
     - Highlight compliance-critical events (e.g. certain disclosures, reporting deadlines).
   - Participants:
     - Understand which dates are “soft” vs “must not be missed.”

2. **Vendor and content provider usage**
   - Where vendors or legal content providers supply:
     - Guidance on timelines.
   - Engine:
     - Incorporates these into `JurisdictionRuleSet` values as appropriate.

### Existing infrastructure to reuse / extend

- **Deadline engine and rule sets**
  - Compliance-critical attributes should:
    - Be encoded in the same `JurisdictionRuleSet` used for general dates.

- **Notifications**
  - Compliance events should:
    - Feed into the notification system with appropriate priority.

### Gaps that require new work

- **Compliance tagging**
  - Identify which timelines and milestones:
    - Are linked to regulatory requirements (local, state, or federal).

- **Content integration**
  - Establish:
    - How internal legal/compliance teams or external vendors contribute:
      - Updates to rules and tags.

