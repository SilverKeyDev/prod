# Profile feature

> **Status:** Shipped  
> **Last verified:** 2026-06-07  
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
| `hooks/useProfilePersonalizationModel.ts` | Shared form state + explicit save for profile/settings |
| `hooks/useEmbeddedPreferencesForm.ts` | Autosave form state for embedded contexts |
| `utils/onboarding/sync/profileFormSync.ts` | API ↔ form (`userPreferencesToOnboardingData`, `formDataToPreferencesPayload`) |

## UI surfaces

| Surface | Entry | Save model |
| ------- | ----- | ---------- |
| Profile / Settings | `ProfileScreen`, `PersonalizationSettingsScreen` | Explicit save via `useProfilePersonalizationModel` |
| Embedded (checklists, search filters, modal) | `PreferencesFormContent` | Autosave via `useEmbeddedPreferencesForm` |

`PersonalizationSettingsScreen` and `ProfileScreen` render sections through `ProfileFeatureSectionPanels` / `ProfileSectionPanel`, which call `renderProfileSectionContent`.

`PreferencesFormContent` defaults to `HousingSection` + `LocationSection` only (checklist/search scope). Checklists may pass `renderContent` to customize fields.

## Section router

`renderProfileSectionContent` in `components/formSections/renderProfileSectionContent.tsx` maps `sectionId` → section component.

| `surface` prop | Behavior |
| -------------- | -------- |
| `"profileScreen"` | Passes `photoProps` to demographics; omits maps script props on location |
| `"settings"` | Passes `scriptsReady` / `loadError` to `LocationSection`; scroll-all layout via `ProfileFeatureSectionPanels` |

## Onboarding

Step registry and flow templates: [profile-onboarding-flow.md](./profile-onboarding-flow.md).

Web and native step UI: `renderOnboardingStep.web.tsx` / `renderOnboardingStep.native.tsx` — compose `formSections`, `profileScreen/tabs`, and `onboarding/buyer/` content.

## Related

- [search-area-resolution.md](../search-area-resolution.md)
