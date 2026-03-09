## Option: Collaboration and Permissions Model

### Problem / goal

We need a permissions model that:
- Supports multiple roles per transaction (buyer, agent, TC, loan officer, etc.).
- Is flexible enough for future expansion.
- Is simple enough to reason about and implement reliably.

### Existing infrastructure to align with

- **Global roles**
  - Existing `User` and agent models with:
    - High-level “agent vs client” distinctions.

- **Feature permissions**
  - Any current checks that:
    - Restrict access to certain routes or features.

For transactions, we want a **transaction-scoped permissions model** that composes with these existing global roles.

---

### Option A – Role-based access control (RBAC) per transaction (recommended)

**Idea:** Each `TransactionParticipant` has a role (buyer, agent, TC, etc.), and each role maps to:
- A predefined set of capabilities.
- Optional overrides at the participant or feature level.

- **Pros**
  - Intuitive and consistent:
    - Easy to explain to product, agents, and engineers.
  - Matches how teams think about responsibilities.
  - Straightforward to implement:
    - Role-to-capability maps.
- **Cons**
  - Some fine-grained scenarios may require:
    - Additional override mechanisms (v2).

**Recommendation:** Use this as the primary model.

---

### Option B – Attribute-based access control (ABAC)

**Idea:** Access decisions made from a flexible set of attributes:
- User attributes (role, brokerage, license state).
- Transaction attributes (stage, jurisdiction).
- Resource attributes (owner, sensitivity).

- **Pros**
  - Extremely flexible.
  - Can model nuanced policies and exceptions.
- **Cons**
  - More complex to:
    - Implement.
    - Test.
    - Explain to stakeholders.

**Conclusion:** Overkill for v1; RBAC is sufficient and easier to manage.

---

### Option C – Hard-coded per-feature permissions

**Idea:** Each feature (checklists, docs, calendar) defines its own logic:
- “If user is agent or TC, allow X; if buyer, allow Y…”

- **Pros**
  - Fast to get something working.
- **Cons**
  - Quickly becomes inconsistent and brittle.
  - Difficult to apply cross-cutting changes or reason about overall access.

**Conclusion:** Not recommended as a long-term foundation.

---

### Recommended v1 path

Adopt **Option A (transaction-scoped RBAC)**:

- **Backend**
  - `TransactionParticipant` with role and optional metadata per transaction.
  - `RoleTemplate` definitions that map roles to:
    - Capabilities across:
      - Checklists.
      - Calendar.
      - Documents.
      - Invites and activity.

- **Frontend**
  - UI should:
    - Derive capabilities from:
      - Transaction-scoped roles.
    - Avoid repeating permission logic; rely on backend signals where possible.

- **Evolution**
  - Where necessary, add:
    - Small, explicit overrides (e.g. restricting a specific doc or task).
  - Consider ABAC or policy-as-code only if/when transaction complexity demands it.

