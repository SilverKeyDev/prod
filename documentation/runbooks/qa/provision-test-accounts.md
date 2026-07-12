# Provision QA test accounts (SIL-145 / SIL-126 step 1)

One durable login per role, credentials in [`test-accounts.json`](./test-accounts.json). Disposable pre-launch accounts — not production customer data.

**Step 2 (agents):** [`.cursor/rules/shared/qa-test-accounts.mdc`](../../../.cursor/rules/shared/qa-test-accounts.mdc) reads this file for automated sign-in and flow probing.

## Inbox (free, no Workspace)

1. Create or reuse a free Gmail (e.g. `silverkeyqa@gmail.com`).
2. **Disable MFA** on that Google account so shared/automated sign-in is not blocked.
3. Use **plus-addressing**: `silverkeyqa+buyer@gmail.com`, `+agent`, `+seller`, `+brokerage`, `+partner`, `+signup1` for one-time signup runs — all deliver to the same inbox.
4. Set one **shared password** in `test-accounts.json` (`sharedPassword`).

Optional: keep password out of git by moving it to gitignored `test-accounts.local.json` (merge `sharedPassword` at runtime); committing the password is acceptable for this epic.

## API base URL note

`test-accounts.json` lists `baseUrls.api` as `https://api.usesilverkey.com`. The client bundle today uses `https://usesilverkey.com` for production API ([`Client/packages/config/env.ts`](../../../Client/packages/config/env.ts)). If the `api.` subdomain is not live yet, use `https://usesilverkey.com` for login/signup curls and update `baseUrls.api` when DNS is cut over.

## Per-role provisioning

Use `sharedPassword` from `test-accounts.json` for every account. Display name suggestion: `QA {Role}` (e.g. `QA Buyer`).

| Role | Email alias | After verify |
| ---- | ----------- | ------------ |
| **buyer** | `silverkeyqa+buyer@gmail.com` | Onboarding role **Buyer** → complete buyer flow → **seed 1 saved search** |
| **agent** | `silverkeyqa+agent@gmail.com` | Onboarding role **Agent** → brokerage / licensing / territory → **link buyer account** (`+buyer`) as a client |
| **seller** | `silverkeyqa+seller@gmail.com` | Public `/signup` or onboarding role **Seller** → complete seller onboarding |
| **brokerage** | `silverkeyqa+brokerage@gmail.com` | Full signup + brokerage onboarding → must land in **brokerage workspace** (not buyer/agent/seller). Requires `brokerage_org_ids` and/or `brokerage_admin` in `user_roles` — coordinate with a **super_admin** to attach org membership and **seed 1 linked agent** (`+agent`) |
| **integration_partner** | `silverkeyqa+partner@gmail.com` | Sign up + verify; grant `integration_partner` via super_admin when the role exists (no in-repo onboarding yet) |
| **disposable** | `silverkeyqa+signup{N}@gmail.com` | Fresh alias per one-time signup test; do not add to `accounts[]` unless promoting to a durable role |

### Signup → verify (all roles)

1. Open `{baseUrls.web}/signup` (or `/login` if account already exists).
2. Submit name, alias email, `sharedPassword`.
3. Open the shared Gmail inbox; copy the 6-digit code from the latest SilverKey verification email.
4. Complete `/verification` with email + code + password.
5. Finish onboarding for the target role.

### Sign-in check (acceptance)

### Automated provision (preferred)

```bash
./scripts/qa/provision-test-accounts.sh
```

Creates Cognito users (admin API, no inbox OTP), DB rows, `user_roles`, buyer saved home, and agent↔buyer link. Restart `make dev` after first run if login returns `id: null`.

For each row in `accounts[]`:

1. Desktop web: `{baseUrls.web}/login` → email + `sharedPassword` → lands on correct workspace dashboard (not wrong shell).
2. API check: `./scripts/qa/verify-qa-test-accounts.sh` (pass/fail only, no tokens).

## Seeding checklist

- [ ] Buyer: at least one saved search / library item
- [ ] Agent: `AgentConnections` (or equivalent) to `silverkeyqa+buyer@gmail.com`
- [ ] Brokerage: at least one agent linked under the brokerage org
- [ ] Seller: seller workspace reachable with non-empty shell
- [ ] Integration partner: correct workspace or admin-granted role documented

## MFA

Confirm MFA is **off** on the shared Gmail and that Cognito users are not forced through TOTP for these aliases.

## Related

- [flow-signup-and-verification.md](./flow-signup-and-verification.md)
- [env-and-device-matrix.md](./env-and-device-matrix.md)
- [test-accounts.example.json](./test-accounts.example.json) — schema template
