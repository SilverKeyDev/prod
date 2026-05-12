## Option: Notification Architecture

### Problem / goal

Transactions will generate many events (checklist changes, deadline warnings, signatures, reviews, integrations).
We need a notification architecture that:
- Reuses existing email/push infrastructure.
- Supports role-based defaults and user preferences.
- Avoids duplicated or noisy notifications.

### Existing infrastructure to align with

- **Notifications design docs**
  - `documentation/to-implement-soon/notifications/delivery-email.md` and related files.

- **Backend email/push services**
  - Any utilities under `Server/app/services/*` that handle:
    - Email delivery.
    - Push notifications.

- **Frontend in-app notifications**
  - Toasts and banners via:
    - `useUIStore` and `enqueueToast`.

We must treat transaction notifications as **first-class event types** flowing through the same system.

---

### Option A – Central event bus + routing layer (recommended)

**Idea:** Emit structured `NotificationEvent`s into a central service that handles:
- Routing (which users, which channels).
- Deduplication and batching.
- Logging and metrics.

- **Pros**
  - Single place to manage:
    - New event types.
    - Routing rules.
    - Preferences and rate limits.
  - Decouples event producers (checklists, deadlines, agreements, integrations) from delivery mechanisms.
- **Cons**
  - Requires an abstraction layer and clear event schemas.

**Recommendation:** Use this as the pattern; transaction modules only emit events.

---

### Option B – Per-feature direct delivery

**Idea:** Each feature (checklists, agreements, integrations) sends its own emails and push notifications directly.

- **Pros**
  - Simpler to implement in the short term.
- **Cons**
  - Quickly leads to:
    - Duplicated logic.
    - Inconsistent behavior.
    - Harder user preference management.

**Conclusion:** Not recommended for a system of this scope.

---

### Option C – Transaction-only notification stack

**Idea:** Stand up a separate notifications pipeline just for transactions.

- **Pros**
  - Allows experimentation without touching existing notifications.
- **Cons**
  - Violates the “single notifications system” principle.
  - Increases operational overhead.

**Conclusion:** Avoid; better to evolve the existing system.

---

### Recommended v1 path

Adopt **Option A (central event bus + routing)**:

- **Backend**
  - Define a `NotificationEvent` schema shared by:
    - Checklist engine.
    - Deadline engine.
    - Signing and integrations.
  - Central service:
    - Applies role-based defaults (per role template).
    - Merges with user-specific preferences (`NotificationPreference`).
    - Sends via existing email/push mechanisms.

- **Frontend**
  - In-app notifications:
    - React to the same events where relevant.

- **Operations**
  - Monitor notification volumes and error rates.
  - Introduce batching/digesting where needed (e.g. daily summary of upcoming deadlines).
