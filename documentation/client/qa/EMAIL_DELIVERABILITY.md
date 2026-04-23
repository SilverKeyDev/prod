# Transactional email and deliverability (SPF, DKIM, DMARC)

**Goal:** every transactional message **arrives in the Inbox** (not Promotions/Spam) for real users, and **DNS** authenticates the sending domain.

## 1. DNS and authentication (ops)

| Record | Purpose |
|--------|---------|
| **SPF** | Authorize sending sources (e.g. ESP, SES) for the domain. |
| **DKIM** | Cryptographic signature per message; align with the **From** domain. |
| **DMARC** | Policy for fail alignment; start with `p=none` or `p=quarantine` before `reject` as appropriate. |

**Validate** with external tools (e.g. MXToolbox, Google Admin Message headers, or your ESP’s dashboard) in **production** and **staging** if staging sends real mail.

**Alignment:** For strict DMARC, **envelope** and **From** domains should match policy (strict vs relaxed) per your ESP’s docs.

## 2. Content and headers

- Clear **From** name and address; no look-alike domains.
- **List-Unsubscribe** where required (especially bulk or marketing); transactional-only streams may be exempt in some jurisdictions — follow legal.
- Consistent HTML templates: `Client/packages/email-templates/`, server pipeline under `Server/app/services/email/`.

## 3. Inbox smoke tests (same template, multiple providers)

For **each** critical template, send a test to inboxes on:

- Gmail
- Microsoft (Outlook / Hotmail)
- Yahoo
- **iCloud** (important for **Mobile Safari** / Apple users)

**Record:** Inbox vs **Promotions** vs **Spam**; any “via” / domain alignment warnings in raw headers.

### Template list (adjust to your product)

- [ ] Signup / email verification
- [ ] Password reset (if any)
- [ ] Invoice / receipt / billing (if Stripe or app sends)
- [ ] High-value product emails (e.g. calendar, doc signature) if they drive revenue

## 4. Staging

Use a staging **subdomain** with correct SPF/DKIM for that subdomain, or expect deliverability to differ from production. For parity, mirror production’s ESP and DNS where possible.

## Related

- [FLOW_SIGNUP_AND_VERIFICATION.md](./FLOW_SIGNUP_AND_VERIFICATION.md)
- [FLOW_PAYMENTS.md](./FLOW_PAYMENTS.md)
- [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md)
- [compliance/DATA_RETENTION.md](../../../compliance/DATA_RETENTION.md) — retention and opt-out after deletion
