# Homeauth feature

> **Status:** Shipped  
> **Last verified:** 2026-05-28  
> **Code:** `Client/packages/features/homeauth/`

Authentication, session bootstrap, onboarding entry, secure auth flows. Tokens in memory + `sessionStorage` (not localStorage).

## Key areas

| Area | Path |
|------|------|
| Session / bootstrap | `hooks/data/session/` |
| Auth store | `store/auth.slice.ts` |
| Onboarding entry | `components/flows/OnboardingFeature.tsx` |

## Related

- [profile-onboarding.md](./profile-onboarding.md)
- `.cursor/rules/shared/security.mdc`
