# SES + Cognito onboarding (SIL-46)

**Linear:** [SIL-46](https://linear.app/silverkey/issue/SIL-46/configure-aws-ses-email-for-aws-cognito-sign-up)  
**Milestone:** Custom SES for cognito onboarding  
**Region:** `us-east-2` (SilverKey primary)

Phase 1 foundation: verify the sending domain in SES, wire Cognito auth emails through SES, exit the SES sandbox, and document the shared identity reused by server-side sends ([SIL-187](https://linear.app/silverkey/issue/SIL-187)).

## Current state (repo)

| Area | Status |
|------|--------|
| Cognito user pool | `prod-silverkey-users` — signup / verify / password reset via Cognito API (`Server/app/services/auth/`) |
| Server SES sends | `Server/app/services/email/send_test_emails_via_ses.py`, `run_email_listings.py` ([SIL-187](https://linear.app/silverkey/issue/SIL-187)) |
| Shared sender constant | `noreply@usesilverkey.com` — `Server/app/services/email/ses_config.py` |
| DNS (SPF/DKIM/DMARC) | **Ops task** — add records at domain registrar |
| Cognito → SES | **Ops task** — switch pool email provider from Cognito default to SES |

## End-to-end checklist

### 1. SES domain identity (`usesilverkey.com`)

1. AWS Console → **SES** → **Verified identities** → **Create identity** → **Domain**.
2. Domain: `usesilverkey.com`.
3. Enable **Easy DKIM** (RSA 2048).
4. Copy the **DKIM CNAME** records SES provides → add at DNS host (same place as existing site DNS).
5. Wait until SES shows identity status **Verified** and DKIM **Successful**.

**Optional:** verify a subdomain for staging (e.g. `mail.staging.usesilverkey.com`) before touching production bulk sends.

### 2. DNS authentication (registrar / Route 53)

| Record | Purpose | Example |
|--------|---------|---------|
| **SPF** (TXT on root or mail subdomain) | Authorize SES to send | `v=spf1 include:amazonses.com ~all` |
| **DKIM** (3× CNAME from SES console) | Per-message signature | Provided by SES Easy DKIM |
| **DMARC** (TXT `_dmarc.usesilverkey.com`) | Alignment policy | `v=DMARC1; p=none; rua=mailto:dmarc@usesilverkey.com` |

Start DMARC at `p=none`; move to `quarantine` / `reject` after monitoring (see [EMAIL_DELIVERABILITY.md](../../client/qa/EMAIL_DELIVERABILITY.md)).

Validate with MXToolbox or raw message headers after first live send.

### 3. Exit SES sandbox

While in sandbox, SES only sends to **verified recipient** addresses.

1. SES → **Account dashboard** → **Request production access**.
2. Use case: transactional (signup verification, password reset, product notifications).
3. Expected volume: state realistic monthly send estimate.
4. Wait for AWS approval (often 24–48h).

**Blocker for real users:** Cognito verification emails will fail for unverified recipients until sandbox exit completes.

### 4. Cognito user pool → send with SES

Pool: **`prod-silverkey-users`** (see [aws-resources.md](../aws-resources.md)).

1. Cognito → **User pools** → `prod-silverkey-users` → **Messaging**.
2. **Email provider:** choose **Send email with Amazon SES** (not Cognito default).
3. **SES Region:** `us-east-2`.
4. **FROM email address:** `noreply@usesilverkey.com` (must be on verified domain).
5. **Configuration set:** leave empty for SIL-46; add in [SIL-188](https://linear.app/silverkey/issue/SIL-188) for bounce/complaint tracking.
6. Save.

**IAM:** Cognito needs permission to send via SES. If the console offers to create/update the role, accept. Otherwise ensure the Cognito service-linked role / custom role includes `ses:SendEmail` and `ses:SendRawEmail` on the verified identity ARN.

### 5. Message templates (verification + password reset)

Still under **Messaging** → **Message templates**:

| Template | Cognito trigger | Notes |
|----------|-----------------|-------|
| Verification | Sign-up / resend code | Include `{####}` for code; optional `{username}` |
| Forgot password | `ForgotPassword` flow | Same code placeholder |

**Branding:** Cognito built-in templates are enough for SIL-46. Full HTML branding or Lambda **CustomEmailSender** is optional follow-up (KMS + Lambda); not required to unblock auth mail.

### 6. Smoke test (after sandbox exit)

```bash
# Local API running; use a real inbox you control
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@yourdomain.com","password":"TestPass1!","name":"SES Test"}'
```

Confirm:

- [ ] Email arrives (inbox, not spam)
- [ ] **From:** `noreply@usesilverkey.com`
- [ ] Headers show `dkim=pass`, `spf=pass` (or aligned via SES)
- [ ] Verification code works on `/api/v1/auth/verify` (or client signup flow)
- [ ] Password reset (`ForgotPassword`) delivers and completes

Repeat with Gmail, Outlook, and iCloud if possible ([deliverability QA](../../client/qa/EMAIL_DELIVERABILITY.md)).

### 7. Server-side SES (shared config)

Application code reads shared settings from `Server/app/services/email/ses_config.py`:

| Constant / helper | Value |
|-------------------|-------|
| `SES_SENDING_DOMAIN` | `usesilverkey.com` |
| `SES_DEFAULT_SENDER_EMAIL` | `noreply@usesilverkey.com` |
| `get_ses_client()` | Boto3 SES in `us-east-2` |
| `get_ses_sender_email()` | Default sender; override with `SES_SENDER_EMAIL` for dev smoke tests only |

**Do not** add new mandatory `.env` keys for SIL-46. Runtime uses existing `AWS_REGION` / instance role credentials. Optional override: `SES_SENDER_EMAIL` for local testing against a verified address in sandbox.

Future [SIL-187](https://linear.app/silverkey/issue/SIL-187) / [SIL-188](https://linear.app/silverkey/issue/SIL-188) will add configuration set name and SNS/SQS ARNs via Secrets Manager — not new flat env vars.

## Acceptance criteria (SIL-46)

- [ ] `usesilverkey.com` verified in SES with DKIM passing
- [ ] SPF + DMARC published
- [ ] SES production access approved (out of sandbox)
- [ ] Cognito pool sends verification + password-reset email via SES
- [ ] Smoke tests pass on at least one external inbox
- [ ] This doc + `aws-resources.md` SES section updated

## Who does what

| Task | Owner |
|------|-------|
| DNS records at registrar | Jayce / whoever owns `usesilverkey.com` DNS |
| SES sandbox exit request | Yash (submit) + Jayce (approve AWS account if needed) |
| Cognito console changes | Pair with Jayce first time (production pool) |
| Code + docs in repo | Yash |

## Related

- [aws-resources.md](../aws-resources.md) — Cognito, IAM, Secrets Manager
- [EMAIL_DELIVERABILITY.md](../../client/qa/EMAIL_DELIVERABILITY.md) — SPF/DKIM/DMARC QA
- [Notification Systems project](https://linear.app/silverkey/project/notification-systems-f44e58377593) — execution order SIL-46 → SIL-188 → SIL-187
