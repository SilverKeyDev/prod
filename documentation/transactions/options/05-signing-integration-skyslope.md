## Option: Signing Integration with SkySlope

### Problem / goal

We are migrating from a DocuSign-specific world to a **provider-agnostic signing abstraction** backed by **SkySlope**.  
We need to decide:
- How deeply to embed SkySlope into our agreement and checklist flows.
- How much of the integration should be hidden behind `SignatureProvider`.

### Existing infrastructure to align with

- **Signature abstraction**
  - `Server/app/services/signature/base.py`:
    - `SignatureProvider` interface.
    - `NoOpSignatureProvider` stub.

- **Agreement model**
  - `Server/app/models/documents/agreement.py`:
    - DocuSign-era fields (`docusign_envelope_id`, etc.) that need a migration story.

- **Documents UI**
  - `Client/packages/features/documents/*`:
    - Lists and detail views for agreements and their status.

We should build SkySlope integration on top of these foundations, not alongside them.

---

### Option A – SkySlope fully behind SignatureProvider (recommended)

**Idea:** Implement SkySlope as the concrete `SignatureProvider` and:
- Keep agreements and UI mostly provider-agnostic.
- Use provider-specific metadata fields only where strictly necessary.

- **Pros**
  - Clean separation:
    - Core domain code depends on `SignatureProvider` interface, not SkySlope details.
  - Easier future migration:
    - To other providers or dual-provider setups.
  - Simplifies:
    - Checklist and timeline logic; they only care about normalized statuses.
- **Cons**
  - Requires careful mapping of SkySlope status codes to our normalized status values.
  - Some advanced provider features may need additional extension points.

**Recommendation:** Use this as the primary strategy.

---

### Option B – SkySlope-centric agreement model

**Idea:** Make SkySlope concepts first-class in agreement models and UI:
- Store many provider-specific fields and statuses directly in our core models.

- **Pros**
  - Easier to surface SkySlope-specific features in the UI.
  - Direct alignment with how eXp agents think about their forms and workflows.
- **Cons**
  - Locks us into SkySlope semantics throughout the stack.
  - Makes future provider diversification much harder.

**Conclusion:** Avoid as a primary approach; limited provider-specific fields are fine but should be contained.

---

### Option C – Parallel “SkySlope agreement” path

**Idea:** Create a separate “SkySlope agreements” system parallel to our existing agreements.

- **Pros**
  - Leaves the existing DocuSign-era system untouched.
- **Cons**
  - Duplicated logic and data models.
  - Confusing UX with multiple types of agreements.
  - Hard to maintain in the long term.

**Conclusion:** Not recommended.

---

### Recommended v1 path

Adopt **Option A (Skyslope behind SignatureProvider)**:

- **Backend**
  - Implement `SignatureProvider` with SkySlope APIs:
    - `create_signature_request`
    - `get_signature_status`
    - `get_signing_url`
    - `cancel_signature`
  - Migrate `Agreement` model fields:
    - Gradually replace DocuSign-specific fields with more generic ones, plus:
      - A provider-specific metadata field for SkySlope IDs if needed.

- **Frontend**
  - Keep agreement UI largely unchanged:
    - Use provider-agnostic status values and actions (send, remind, cancel).
  - Use `useAgreementSignature` hook as the **single entry point** for signature status in the client.

- **Checklist and timeline**
  - Treat signature status as:
    - A normalized set of states consumed by:
      - Checklist completion logic.
      - Deadline and notification engines.

