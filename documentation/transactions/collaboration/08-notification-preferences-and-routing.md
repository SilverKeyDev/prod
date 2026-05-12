## Notification Preferences and Routing

### Problem / goal

Different participants in a transaction have different notification needs:
- Buyers may want more granular updates.
- Agents and TCs may prefer batched or higher-level alerts.
- Loan officers and escrow officers may only need event-specific notifications.

We need a model and UX for:
- **Per-role defaults**.
- **Per-user preferences**.
- Routing notifications to:
  - Push.
  - Email.
  - In-app surfaces.

### Data model & invariants

- **NotificationPreference**
  - `id`
  - `user_id`
  - `channel` (`email`, `push`, `in_app`)
  - `event_type` or `event_category`
  - `enabled` (boolean)
  - Optional:
    - `digest` options (immediate, daily summary, etc.).

Invariants:
- Global safety rules apply:
  - Certain security/critical alerts cannot be fully disabled.
- Defaults are derived from:
  - Role templates.
  - Application-wide policies.

### Flows / UX

1. **Defaults per role**
   - When a user joins a transaction with a given role:
     - System applies role-based defaults:
       - Buyer: get granular updates for tasks and deadlines.
       - Agent: get key milestones and review requests, fewer minor updates.
       - TC: high volume of operational alerts.

2. **User-level customization**
   - Users can access a “Notification settings” screen to:
     - Turn on/off certain event categories per channel.
     - Adjust digest/batch preferences.

3. **Routing**
   - For each `NotificationEvent`:
     - The routing layer:
       - Looks up role-based defaults and user preferences.
       - Determines which channels to use.
       - Enqueues actual deliveries (email, push, in-app).

### Existing infrastructure to reuse / extend

- **Notification events**
  - `integrations/08-notifications.md` defines the core event types.

- **Email and push infrastructure**
  - Any existing services that:
    - Send emails.
    - Deliver push notifications.
  - These should be reused as the final delivery mechanism.

- **UI for toasts and in-app messages**
  - Existing state/hooks like:
    - `useUIStore` and `enqueueToast`.
  - Should be integrated so they respond to the same NotificationEvents.

### Gaps that require new work

- **Preferences storage and APIs**
  - Back-end storage and endpoints to:
    - Read/update user notification preferences.
    - Compute effective preferences from role defaults + overrides.

- **Role template definitions for notifications**
  - Similar to permission templates, define:
    - Which events are on/off by default per role and channel.

- **Settings UI**
  - A simple but clear UI for participants to:
    - Adjust which transaction-related notifications they receive.
