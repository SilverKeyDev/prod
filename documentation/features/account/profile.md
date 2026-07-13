# Profile feature

> **Status:** Shipped
> **Last verified:** 2026-07-10
> **Code:** `Client/packages/features/profile/`

User profile, onboarding steps, search preferences, availability, financial sections, and agent public profile.

## Folder map

| Path | Role |
| ---- | ---- |
| `components/formSections/` | Canonical **editable** section components (demographics, financial, location, agent fields, housing rows) |
| `components/profileScreen/tabs/` | **Composite** section wrappers used in profile/settings (housing essentials/ranges, search property, privacy) |
| `components/profileScreen/searchPreferences/` | Buyer extension field groups (physical, condition, utilities, etc.) |
| `components/onboarding/` | Step dispatchers (`renderOnboardingStep.*`) and buyer step content |
| `components/settings/` | Web personalization page and embedded autosave form |
| `components/pages/` | Public profile page content, lookup, canonical redirects, SEO meta |
| `components/publicSite/` | Web-only public agent site sections: hero, listings, testimonials, social |
| `hooks/useProfilePersonalizationModel.ts` | Shared form state + explicit save for profile/settings |
| `hooks/useEmbeddedPreferencesForm.ts` | Autosave form state for embedded contexts |
| `hooks/data/usePublicAgentProfileLookup.ts` | Route-param resolver for `/a/:publicSlug` and `/agent-profile/:name/:briefSlug` |
| `hooks/data/usePublicAgentListings.ts` | Public MLS listing query and active/sold bucket split |
| `utils/onboarding/sync/profileFormSync.ts` | API ↔ form (`userPreferencesToOnboardingData`, `formDataToPreferencesPayload`) |

## UI surfaces

| Surface | Entry | Save model |
| ------- | ----- | ---------- |
| Profile / Settings | `ProfileScreen`, `PersonalizationSettingsScreen` | Explicit save via `useProfilePersonalizationModel` |
| Embedded (checklists, search filters, modal) | `PreferencesFormContent` | Autosave via `useEmbeddedPreferencesForm` |
| Public agent site (web) | `AgentProfilePageContent.web.tsx`, `AgentPublicProfileView.web.tsx` | Read-only public API; profile share row uses `/a/{publicProfileSlug}` when available |

`PersonalizationSettingsScreen` and `ProfileScreen` render sections through `ProfileFeatureSectionPanels` / `ProfileSectionPanel`, which call `renderProfileSectionContent`.

`PreferencesFormContent` defaults to `HousingSection` + `LocationSection` only (checklist/search scope). Checklists may pass `renderContent` to customize fields.

## Section router

`renderProfileSectionContent` in `components/formSections/renderProfileSectionContent.tsx` maps `sectionId` → section component.

| `surface` prop | Behavior |
| -------------- | -------- |
| `"profileScreen"` | Passes `photoProps` to demographics; omits maps script props on location |
| `"settings"` | Passes `scriptsReady` / `loadError` to `LocationSection`; scroll-all layout via `ProfileFeatureSectionPanels` |

## Onboarding

Step registry and flow templates: [profile-onboarding.md](./profile-onboarding.md).

Web and native step UI: `renderOnboardingStep.web.tsx` / `renderOnboardingStep.native.tsx` — compose `formSections`, `profileScreen/tabs`, and `onboarding/buyer/` content.

## Public agent profile

Shareable public profiles now have a dedicated web landing-style layout and
public API surface. See [public-agent-profile.md](./public-agent-profile.md) for
the URL model, unauthenticated API reads, MLS listing attribution, testimonials,
demo seed scripts, and QA smoke checks.

## Related

- [search-area-resolution.md](../search/search-area-resolution.md)
