# Signup and email verification (web and native)

Code references: web `SignupFeature` → `POST /api/v1/auth/signup` via `useSignup`; mobile `SignupScreen.native`. See paths under `Client/packages/features/homeauth/components/signup/`.

## Evidence to capture

For each run, save **browser/device**, **build**, **date**, and one of: screenshot set or short screen recording.

## Web — manual E2E

1. Open `/signup` (route constant `ROUTES.SIGNUP` = `/signup`).
2. **Validation:** submit empty or weak password; confirm client-side password rules and errors.
3. **Happy path:** valid name, email, password (and phone/agency if shown); submit.
4. **Expect:** success navigates toward verification (e.g. verification route with email in state); no silent failure.
5. **Email:** open inbox for the sign-up address; confirm verification **email** arrived (see [EMAIL_DELIVERABILITY.md](./EMAIL_DELIVERABILITY.md)).
6. **Verify:** complete code or link; confirm account reaches authenticated state (e.g. dashboard or onboarding).
7. **Negative:** wrong code, expired code (if testable) — user-visible error, no crash.

## React Native — manual E2E

Automated E2E for the app is not in this repo; use a physical device or simulator with a test build.

1. From the auth stack, open **Create your account** (same flow as `SignupScreenNative`).
2. Repeat validation and happy path as on web.
3. Confirm **deep link** or in-app navigation to **verification** after signup.
4. Complete verification; confirm post-auth screen.
5. **Mobile Safari (web only):** if users can complete signup in **Safari on iOS** (marketing site or PWA), repeat the web steps on a **real device** (see [ENV_AND_DEVICE_MATRIX.md](./ENV_AND_DEVICE_MATRIX.md)).

## Native parity checklist (quick)

| Step              | Web | iOS | Android |
|-------------------|-----|-----|---------|
| Form validation   |     |     |         |
| Success → verify  |     |     |         |
| Email received    |     | N/A | N/A     |
| Verify completes  |     |     |         |

## Related

- [END_TO_END_QA_RUNBOOK.md](./END_TO_END_QA_RUNBOOK.md) — execution order and scope.
