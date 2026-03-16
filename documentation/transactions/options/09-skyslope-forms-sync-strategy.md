## Option: SkySlope Forms Sync Strategy

### Problem / goal

Transaction forms are pulled from **FMLS**, **eXp API**, and/or **SkySlope**. SkySlope holds the **authoritative forms library** for many agents (especially at eXp).  
We must decide how to:
- Discover available forms/templates.
- Keep metadata reasonably fresh.
- Avoid over-fetching or stale caches.

### Existing infrastructure to align with

- **Agreement and document models**
  - `Server/app/models/documents/agreement.py` and related models.

- **SkySlope integration**
  - Strategy described in `integrations/09-skyslope-forms-library-and-templates.md`.

---

### Option A – Just-in-time fetch with short caching (recommended)

**Idea:** When an agent opens “Add from SkySlope”:
- Call SkySlope APIs to list forms/templates.
- Cache results for a short period (e.g. minutes to an hour).

- **Pros**
  - Always close to up-to-date when an agent browses.
  - Minimal background workload.
  - Simple mental model (UI shows what SkySlope says now).
- **Cons**
  - Requires careful handling of:
    - Slow or unavailable SkySlope APIs.

**Recommendation:** Use this approach for v1.

---

### Option B – Scheduled full-library sync

**Idea:** Regularly fetch and persist:
- Most or all of an agent’s forms library in our own DB.

- **Pros**
  - Fast queries against local data.
  - Possible to build advanced search across forms.
- **Cons**
  - More complex:
    - Needs robust sync and reconciliation logic.
  - Potentially heavy load on SkySlope.
  - Must handle permission changes and removals.

**Conclusion:** Consider later if needed for scale or advanced features.

---

### Option C – Static mapping only

**Idea:** Only store:
- A few known SkySlope template IDs in configuration.

- **Pros**
  - Extremely simple to implement.
- **Cons**
  - Not flexible:
    - Doesn’t reflect the full set of forms agents may need.
  - Requires manual updates for every new/changed form.

**Conclusion:** Too limiting for the intended use case.

---

### Recommended v1 path

Adopt **Option A (just-in-time fetch)**:

- **Backend**
  - Build a small SkySlope client that:
    - Fetches forms on demand when the agent opens selection UI.
    - Caches responses per agent for a short period.
  - Persist only:
    - References and metadata for forms actually attached to transactions.

- **Frontend**
  - “Add from SkySlope”:
    - Drives the on-demand fetch.
    - Displays loading and error states appropriately.

- **Evolution**
  - If usage patterns or performance require:
    - Move toward a hybrid where:
      - Some forms are pre-synced.
      - JIT fetch remains available for edge cases.

