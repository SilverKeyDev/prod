## Option: Address Canonicalization Strategy

This document compares approaches for handling property addresses when starting a new transaction.

### Problem

When a user starts a transaction “from the checklists frame,” they must enter an address. We need to decide:
- How strictly to enforce **canonical, geo-codable addresses**.
- How to handle edge cases (new construction, rural properties, partial matches).
- What happens when address providers (e.g. Google Places) are unavailable.

The product requirement is to be **strict in v1**: users cannot use checklists for a new transaction until they provide a canonical address.

### Existing infrastructure to check

- Places/Maps usage in:
  - `Client/packages/features/calendar/components/view/CreateEventModal.tsx` (location autocomplete).
  - Any existing geo search or maps components in `Client/packages/features/search` or `packages/hooks/data/useGoogleMaps`.
- Property details or search schemas that already store:
  - Address breakdown (street, city, state, zip).
  - Lat/lng or placeId.

We should **reuse** existing client-side autocomplete patterns and **align** server-side address storage with existing schemas.

---

### Option A – Strict canonicalization (chosen)

**Idea:** User must select an address from a provider like Google Places; free text cannot complete transaction creation.

- **Pros**
  - High data quality: every transaction has a geo-codable address (placeId + lat/lng).
  - Makes **location enrichment and jurisdiction rules** straightforward.
  - Simplifies deduplication and cross-feature linking (e.g. property search, maps).
- **Cons**
  - Edge cases where Places coverage is limited (rural, new construction) need careful UX:
    - Allow “pin on map” or a fallback flow that still yields lat/lng and a stable identifier.
  - Dependency on external provider uptime; need explicit error states and retries.

**Implementation sketch**
- Client:
  - Address input auto-completes using Places.
  - “Confirm address” button is only enabled when a canonical suggestion is chosen.
- Server:
  - Transaction creation endpoint expects:
    - `placeId`, `normalizedAddress`, `lat`, `lng`, and structured fields where possible.
  - Validates basic shape and stores in `PropertyAddress`.

**Recommendation:** **Use strict canonicalization as the default**, with carefully designed fallback states.

---

### Option B – Lenient free-text with background geocoding

**Idea:** Allow users to type any address and start a transaction; system tries to geocode in the background and warns on failure.

- **Pros**
  - Fewer hard stops for the user; can capture intent even with partial data.
  - More forgiving for edge-case addresses or provider outages.
- **Cons**
  - Degrades data quality:
    - Harder to compute jurisdiction and compliance rules reliably.
    - More likely to break later integrations that assume precise geo data.
  - Complicates engine logic:
    - Every enrichment step must handle “address not yet canonicalized.”

**Conclusion:** Not aligned with v1 requirement to be strict; might be introduced later as a fallback if needed.

---

### Option C – Brokerage / SkySlope-driven address selection

**Idea:** Use the address associated with a SkySlope transaction/record as the canonical source for addresses.

- **Pros**
  - Aligns transaction addresses with what the brokerage already uses for forms and compliance.
  - Could avoid mismatches between forms and internal representation.
- **Cons**
  - Tightly couples transaction creation to SkySlope:
    - Hard for buyers in self-service contexts or before an agent is engaged.
  - Not all workflows will have a SkySlope record at the point when checklists should start.

**Conclusion:** Useful **as a sync/check** (ensure our address matches SkySlope), but not as the primary way to collect addresses.

---

### Recommended approach

Adopt **Option A (strict canonicalization)** with explicit fallback handling:

- **Primary path**
  - Require users to select an address from a reliable autocomplete provider.
  - Capture and store:
    - `placeId`, `normalizedAddress`, structured components, `lat`, `lng`.
  - Use this data as the foundation for:
    - Jurisdiction (state/county) rules.
    - Flood and risk lookups.
    - Timeline and compliance calculations.

- **Fallbacks and resilience**
  - If Places fails temporarily:
    - Show clear error messaging and allow retry, not silent failures.
  - For edge-case addresses:
    - Consider a “drop a pin” or “confirm approximate location” flow that still returns lat/lng and basic components.

- **Integration with SkySlope**
  - Once a SkySlope transaction is connected:
    - Cross-validate addresses.
    - Alert if there is a significant discrepancy (optional v2).

