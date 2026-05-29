# QA runbooks (client)

End-to-end and release QA checklists for the SilverKey **web and mobile** client. **Start here:** [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md).

| Document | Description |
|----------|-------------|
| [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md) | Master execution order and links |
| [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md) | Staging, test users, cross-browser and **real Mobile Safari** |
| [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md) | Signup, verification — manual QA steps |
| [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md) | Billing when product confirms it is live |
| [ACCOUNT_DELETION.md](./ACCOUNT_DELETION.md) | Self-serve gap; admin delete; process |
| [ERROR_STATES.md](./ERROR_STATES.md) | API down, 5xx, 429, payment failure |
| [ERROR_PAGES_404_500.md](./ERROR_PAGES_404_500.md) | 404 page, `RouteErrorBoundary`, CDN 500 |
| [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md) | SPF, DKIM, DMARC, inbox placement |

**How we document:** see [HOW_WE_DOCUMENT.md](../../HOW_WE_DOCUMENT.md) — QA docs live under `documentation/client/qa/`.

**Web automation:** none in-repo; follow manual steps in the linked flow docs.
