## Privacy & Governance

This document defines privacy, security, and governance expectations for the user activity observability system.

The goal is to ensure that richer analytics **never** come at the expense of user privacy or security, and that we can explain clearly what we collect and why.

### Principles

- **Minimum necessary** – Collect only what is needed to support product decisions, debugging, and reliability, not everything we technically can.
- **Separation of concerns** – Keep user identifiers and behavior in separate, well‑defined forms; avoid replicating PII across systems.
- **Defense in depth** – Apply protections at multiple layers: event design, logging clients, transport, storage, and access controls.
- **Transparency and auditability** – Be able to trace when and how configuration changes or schema changes occurred.

### Data We Do NOT Log

The following are explicitly disallowed in user activity events:

- Raw **PII** such as:
  - Email addresses.
  - Phone numbers.
  - Government IDs.
  - Payment card numbers or bank details.
- Secrets or sensitive tokens, including:
  - Access tokens, refresh tokens, API keys.
  - Passwords, one‑time codes.
- Free‑text content that may contain sensitive information:
  - User‑entered notes, messages, descriptions, comments.
- Full request/response bodies from APIs that may contain any of the above.

If an event logically needs to reference a user or entity, it should do so via:

- Internal IDs (e.g. `userId`, `tenantId`, `propertyId`, `transactionId`).
- Stable pseudonymous identifiers (e.g. session IDs).

### PII Handling and Scrubbing

The observability system must rely on and extend the existing scrubbing utilities:

- **Frontend:** `Client/packages/logger/core/pii.ts`
- **Backend:** `Server/logger/pii.py`

Expectations:

- All event payloads pass through PII scrubbing before being persisted or forwarded.
- If new fields are introduced that may contain sensitive data, the scrubbing rules should be updated in lockstep.
- Logs and analytics streams should store **only** the sanitized versions of events.

### Storage, Retention, and Access

Depending on the chosen technology path (application DB vs AWS S3/Athena), the following rules apply:

- **Encryption at rest**
  - Application databases and S3 buckets used for analytics must have encryption at rest enabled.
- **Retention policies**
  - Define clear retention windows for analytics data (e.g. keep detailed events for N months, derived aggregates longer).
  - Implement lifecycle policies where appropriate (e.g. S3 lifecycle rules).
- **Access control**
  - Restrict access to raw analytics data stores to a small set of roles (e.g. admins, data/infra maintainers).
  - The admin workspace should expose **aggregated** views by default, not raw event payloads.

### Configuration and Change Governance

The admin workspace will eventually provide a way to modify logging‑related JSON configurations (e.g. sampling levels, enabled categories). Governance expectations:

- **Schema validation**
  - All config changes must be validated against a strict schema before becoming active.
- **Audit logging**
  - Every change should be logged (who changed what, when, and from which previous value).
  - These audit logs themselves should use the centralized logging utilities and be stored in a secure channel.
- **Rollbacks**
  - Provide a mechanism to revert to a previous known‑good configuration quickly if a change degrades observability or causes issues.

### Consent and Legal Alignment

As the observability system matures and if we expand into more behavioral or marketing‑like tracking, we may need:

- Clear language in user‑facing terms/privacy policy about what is collected and why.
- Mechanisms to:
  - Honor user requests to limit certain types of tracking where required.
  - Respect “do not track” signals or regional requirements as appropriate.

For the initial focus on internal product analytics and reliability, the emphasis is on:

- Avoiding collection of unnecessary personal data.
- Keeping all analytics within the scope of improving the product, not external advertising or resale.

### Governance Process

To keep the system healthy over time:

- Changes to the canonical event schema or major new event categories should:
  - Be proposed in documentation first (updating the data‑sources and schema doc).
  - Undergo code review with explicit privacy and security considerations.
- Periodically review:
  - Which events are actually used to drive decisions.
  - Whether any data can be safely down‑sampled, aggregated, or removed.

This document should be the reference point when evaluating new data collection ideas, ensuring they align with SilverKey’s expectations for privacy and responsible observability.
