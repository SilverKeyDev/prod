## Location Enrichment

### Problem / goal

Given a **canonical property address** (with placeId, normalized address, and lat/lng), we need a reusable location enrichment layer that:
- Derives the **jurisdiction** (state, county, sometimes city) for each transaction.
- Optionally enriches with **risk and regulatory context** (e.g. flood zone hooks, homestead eligibility, coastal overlays).
- Produces data that downstream engines (checklist generator, deadline engine, compliance checks) can rely on.

### Data model & invariants

- `PropertyAddress` holds:
  - Provider identifiers: `place_id`.
  - Structured address fields: street, city, state, postal_code, country.
  - Coordinates: `lat`, `lng`.
- Enrichment outputs can be stored as:
  - Fields on `Transaction` and/or `PropertyAddress`:
    - `state_code`, `county_name`, optional `city_name`.
    - `jurisdiction_ruleset_key` (points to a rule set in the deadline/compliance engine).
  - Optionally, a separate `LocationEnrichment` table if we later cache more detailed attributes.

Invariants:
- Every **active transaction** must have:
  - A known `state_code` and `jurisdiction_ruleset_key`.
  - Stable identifiers sufficient to re-run enrichment if upstream data changes.

### Flows / UX

1. **Transaction creation**
   - Client submits canonical address details to `POST /api/v1/transactions`.
   - Server:
     - Stores `PropertyAddress`.
     - Schedules or performs enrichment (depending on latency budget).
2. **Enrichment execution**
   - Given address/coordinates:
     - Resolve state and county (via geocoding or lookup tables).
     - Determine `jurisdiction_ruleset_key` (e.g. `"us_generic"`, `"us_or"`, `"us_tx"`).
     - Optionally trigger further risk lookups (e.g. flood zones) in a separate step.
3. **Downstream usage**
   - Checklist generation:
     - Uses `jurisdiction_ruleset_key` to include/exclude items (e.g. flood-related tasks).
   - Deadline engine:
     - Uses state and rule set to compute deadlines (inspection window, earnest money, etc.).

### Existing infrastructure to reuse / extend

- **Maps and Places integration**
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx`:
    - Uses Google Maps Places for address autocomplete and suggestions.
    - Already handles `AutocompleteRequest`, `AutocompleteSuggestion`, and `GoogleMapsWindow`.
  - `packages/hooks/data/useGoogleMaps*` (if present) or similar hooks:
    - Likely encapsulate loading of Maps scripts and configuration.

- **Property- and geo-related utilities**
  - Any existing property details enrichment or map search code under:
    - `Client/packages/features/search/` and `Client/packages/utils/domain/search/` (if present).
  - Any backend modules that already:
    - Map lat/lng to jurisdictions or other geographic metadata.

The enrichment service should align with these patterns rather than introducing a completely separate maps stack.

### Gaps that require new work

- **Backend enrichment service**
  - A dedicated function/module (e.g. `services/location/enrichment.py`) that:
    - Takes `PropertyAddress` (or raw coordinates) and returns:
      - `state_code`, `county_name`, optional `city_name`.
      - `jurisdiction_ruleset_key`.
    - Encapsulates calls to any external geocoding or internal lookup tables.

- **Persistence and lifecycle**
  - Clear rules for when enrichment runs:
    - Synchronously on transaction creation when latency is acceptable.
    - Asynchronously via background job when calling slower or rate-limited APIs.
  - Handling of failures:
    - Retry strategies.
    - Fallback rule sets (e.g. `us_generic`) when fine-grained jurisdiction is unavailable.

- **Extension points**
  - Hooks to later add:
    - Flood zone tags.
    - Homestead eligibility flags.
    - Other regulatory/geographic overlays that affect checklists and deadlines.

