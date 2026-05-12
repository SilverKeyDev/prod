## Financial and Service Integrations (HomeConcierge and Beyond)

### Problem / goal

We want checklist items and milestones to be able to **drive and reflect external services**, starting with:
- **HomeConcierge** as an optional move-in/concierge integration.

And leaving the door open for:
- **Loan-related integrations** (application, underwriting, clear-to-close).
- **Financial rails** such as Plaid-based earnest money transfers or other payment providers.

### Data model & invariants

- **IntegrationTask**
  - `id`
  - `transaction_id`
  - `provider_key` (e.g. `home_concierge`, `loan_provider_x`, `plaid_earnest`)
  - `status` (`not_started`, `in_progress`, `completed`, `failed`, `cancelled`)
  - `data` (provider-specific metadata; e.g. external IDs, URLs, timestamps)
  - Optional:
    - `created_by_participant_id`

- **ChecklistItemState**
  - For integration-backed items:
    - `completion_type = integration_based` or `signature_plus_review` with an integration component.
    - `integration_task_id` references the current `IntegrationTask`.

Invariants:
- Each integration-backed checklist item should have **at most one active IntegrationTask** at a time.
- Completion semantics are clearly defined:
  - e.g. item is complete when `IntegrationTask.status = completed` and (if required) review is done.

### Flows / UX

1. **HomeConcierge (v1)**
   - Checklist item: “Schedule your move-in concierge session.”
   - Buyer clicks “Start with HomeConcierge”:
     - System:
       - Creates an `IntegrationTask` (`provider_key = "home_concierge"`).
       - Redirects or deep-links to HomeConcierge, passing necessary context.
   - When HomeConcierge indicates completion (via webhook or callback):
     - System marks the `IntegrationTask` as `completed`.
     - Linked checklist item auto-updates to `done` (or to `pending_review` if a review step is required).

2. **Future loan and earnest money integrations**
   - Loan milestones (e.g. loan application submitted, conditional approval) can:
     - Be triggered or updated via lender APIs.
   - Earnest money:
     - Checklist item “Send earnest money” could:
       - Initiate a Plaid or payment-provider flow.
       - Update its state once funds are confirmed.

3. **Visibility and roles**
   - For each integration:
     - Define which roles can start it (e.g. buyer vs agent).
     - Which roles can see progress or detailed logs.

### Existing infrastructure to reuse / extend

- **Checklists and item metadata**
  - Enrich existing templates (`*_ITEMS` in `Server/app/services/transactions/*/items.py`) with:
    - `integration_key` where appropriate (starting with `home_concierge`).

- **Integration patterns elsewhere**
  - Any existing integration modules under:
    - `Client/packages/services/*` or `Server/app/services/*` that:
      - Handle external API calls with:
        - Timeouts, retries, and error handling.
      - Maintain secure secrets and tokens.

- **Documents and notification infrastructure**
  - For financial events (e.g. earnest money receipt), we may:
    - Record documents or receipts via the document service.
    - Emit `NotificationEvent`s to keep participants informed.

We should **align with existing HTTP and integration patterns** instead of inventing a separate “transactions-only” integration style.

### Gaps that require new work

- **IntegrationTask model and lifecycle**
  - Back-end model and APIs to:
    - Create tasks for a given `provider_key` and `transaction_id`.
    - Update status from:
      - Webhook callbacks.
      - Polling results.
      - Manual overrides when external systems fail.

- **Provider registries and configuration**
  - A simple provider registry (config or code) that describes:
    - Supported providers and their capabilities.
    - Launch URLs or deep-link targets.
    - Expected status transitions and webhook payloads.

- **HomeConcierge integration details**
  - Decide:
    - How to authenticate and identify the user/transaction in HomeConcierge.
    - What data (if any) we store beyond basic status.
  - Build:
    - A small service module for HomeConcierge API calls.
    - Webhook endpoints or callback handlers to update `IntegrationTask`.

- **Security and compliance**
  - Ensure:
    - Secrets and API keys are stored via existing configuration mechanisms.
    - External URLs and redirects are safe and validated.
    - Financial integrations (later) respect:
      - KYC/AML where relevant.
      - Logging and audit requirements.
