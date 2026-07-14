# Payments and subscriptions

## Product gate (required first)

**Confirm with product** which of the following are **live in production (or staging)** before writing E2E cases:

- Stripe Checkout or hosted payment page
- Customer billing portal
- Webhooks (subscription created/updated/deleted, invoice paid/failed)
- In-app gating on `has_subscription` or equivalent

The client includes **billing** query key scaffolding (`Client/packages/config/query/keys.ts`); the database has a **subscriptions** model with Stripe column names in migrations. Server routes and UI may be partial — **do not assume** a full card flow without verification.

## When payments are live — manual E2E

| Step | What to verify |
|------|----------------|
| Subscribe | Test mode card success; user sees success state; DB/webhook state matches. |
| Decline | Stripe [test cards](https://docs.stripe.com/testing#declined-payments) for decline; UI shows a **clear, non-technical** error; no stuck spinner. |
| 3D Secure / SCA | If applicable in your region, use Stripe’s test 3DS flows. |
| Cancel / refund | Per product policy; subscription row and app entitlements update. |
| Portal | “Manage subscription” opens Stripe Customer Portal; return URL works. |
| Emails | Receipt/invoice email arrives and is not in spam (see [email-deliverability.md](./email-deliverability.md)). |

## Automation

- There is **no** in-repo browser E2E for billing. When you add one (e.g. Playwright against staging with test keys), keep card flows out of default CI until secrets and flakiness are managed; use **Stripe’s test clock** where applicable.
- Webhook tests belong in **server** integration tests with signing secret; not duplicated here unless E2E hits a deployed staging stack.

## Evidence

Store Stripe Dashboard event IDs, invoice IDs, and screenshots of app state for at least one success and one failure path.

## Related

- [error-states.md](./error-states.md) — payment failure and API errors
- [end-to-end-qa-runbook.md](./end-to-end-qa-runbook.md)
