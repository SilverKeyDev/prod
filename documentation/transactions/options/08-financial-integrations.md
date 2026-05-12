## Option: Financial Integrations (Loans, Plaid, Earnest Money)

### Problem / goal

We want to support financial workflows (loans, earnest money, future payments) in a way that:
- Fits naturally into checklist items and milestones.
- Allows incremental adoption and provider diversity.

### Existing infrastructure to align with

- **IntegrationTask concept**
  - As defined in `integrations/12-financial-and-service-integrations.md`.

- **Documents and agreements**
  - Loan-related docs and receipts may be stored via the existing document service.

- **Notifications**
  - Financial events should trigger appropriate notifications via the central system.

---

### Option A – Plug-in style IntegrationTask per provider (recommended)

**Idea:** Use a generic `IntegrationTask` model where each provider (loan, Plaid, payment service) is:
- Identified by a `provider_key`.
- Encapsulated behind a small provider-specific service.

- **Pros**
  - Scales to multiple providers and new use cases.
  - Keeps checklist templates simple (just reference `integration_key`).
  - Allows controlled rollout per integration.
- **Cons**
  - Requires extra abstraction layer design.

**Recommendation:** Use this as the baseline for all financial integrations.

---

### Option B – Hard-coded flows per provider

**Idea:** Bake each financial provider’s logic directly into specific routes and checklist handling.

- **Pros**
  - Slightly faster to implement the first provider.
- **Cons**
  - Tight coupling to provider specifics.
  - Harder to test, extend, or swap providers later.

**Conclusion:** Acceptable for prototypes, but not as the production architecture.

---

### Option C – Out-of-band financial steps only

**Idea:** Keep financial tasks fully manual:
- No API calls or integrations; just instructions and checkboxes.

- **Pros**
  - Easiest to implement.
- **Cons**
  - Misses major value of automation and integration.
  - Doesn’t meet long-term product goals for a concierge-like experience.

**Conclusion:** Suitable only as an initial placeholder while integration work is underway.

---

### Recommended v1 path

Adopt **Option A (plug-in style IntegrationTask)** and:

- **Start with HomeConcierge**
  - Use the same pattern as financial providers to validate the abstraction.

- **Design for future loans and Plaid integration**
  - For loans:
    - Model key steps (application, conditional approval, clear to close) as integration-backed or status-driven checklist items.
  - For Plaid/earnest money:
    - Use IntegrationTask to:
      - Start and track transfers.
      - Confirm completion and update checklist/milestones.

- **Focus on security and compliance from the start**
  - Encapsulate financial logic in dedicated services.
  - Follow existing patterns for secret management and logging.
