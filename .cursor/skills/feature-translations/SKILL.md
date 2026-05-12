---
name: feature-translations
description: Ensures translation keys used in feature components resolve to human-friendly copy via typed feature translation modules under Client/packages/features/*/types/translations.ts. Use when UI shows raw i18n keys, or when adding new t(\"feature.*\") keys that need corresponding user-facing text.
---

# Feature Translations from i18n Keys

## Purpose

This skill keeps UI text clean and user-friendly by ensuring that every `t("feature.*")` key used in components has a corresponding human-readable string defined in that feature's typed translation module (for example, `SEARCH_TRANSLATIONS` for the search feature).

Use this whenever:

- You see raw i18n keys (like `search.no_properties_yet`) appearing in the UI.
- You introduce new `t("feature.*")` keys in components.
- You need to extend copy for an existing feature in a consistent, typed way.

## Target Structure

Each feature under `Client/packages/features/<featureName>/` owns its translation strings in:

- `Client/packages/features/<featureName>/types/translations.ts`
- Exported from `Client/packages/features/<featureName>/types/index.ts`
- Aggregated into `Client/packages/contexts/translations/index.ts` via a `* _TRANSLATIONS` constant

Example for the search feature:

- `Client/packages/features/search/types/translations.ts` → `SEARCH_TRANSLATIONS`
- `Client/packages/features/search/types/index.ts` → `export { SEARCH_TRANSLATIONS } from "./translations";`
- `Client/packages/contexts/translations/index.ts` → `...SEARCH_TRANSLATIONS` spread into `TRANSLATIONS`

## Workflow

### 1. Locate the Feature and Keys

1. Use a code search (e.g. Grep) for the i18n key:
   - Pattern: `"featureKey.segment"` (for example, `search.no_properties_yet`).
2. Identify the owning feature from the path:
   - Files under `Client/packages/features/search/**` → search feature.
   - Files under `Client/packages/features/saved/**` → saved feature.
3. Confirm the key is used with the translation hook, typically:
   - `const { t } = useLocalizationContext();`
   - Or an equivalent localization hook/context returning `t`.

### 2. Add or Update Feature Translation Entries

1. Open the feature translation module:
   - Path pattern: `Client/packages/features/<featureName>/types/translations.ts`.
2. Ensure it exports a constant shaped like:
   - `export const <FEATURE>_TRANSLATIONS: Record<string, string> = { ... }`.
3. For each missing key used by the feature (for example, `search.no_properties_yet`, `search.tap_search_to_find`):
   - Add a new entry to the feature translation map with clear, user-facing text.
   - Follow existing tone, capitalization, and sentence structure used by that feature.
   - Prefer complete, readable sentences for helper/empty-state text.

Example (search feature):

```ts
export const SEARCH_TRANSLATIONS: Record<string, string> = {
  // existing keys...
  "search.no_properties_yet": "No properties yet",
  "search.tap_search_to_find": "Tap Search to find homes that match your preferences",
};
```

### 3. Ensure Exports Are Wired Correctly

1. In the feature's `types/index.ts`, confirm the translations constant is exported:
   - `export { SEARCH_TRANSLATIONS } from "./translations";`
2. In the global translations aggregator (`Client/packages/contexts/translations/index.ts`), make sure the feature translations are:
   - Imported: `import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";`
   - Spread into `TRANSLATIONS`:
     - `...SEARCH_TRANSLATIONS,`
3. If a new feature gets its first translation map, add the import and spread entry to the aggregator, following the existing pattern and ordering.

### 4. Validate UI Usage

1. Re-open the component using `t("feature.*")`:
   - Confirm it requests the exact key you added to the translation map.
   - Keep keys stable; if you must rename a key, update all usages across the codebase.
2. Ensure the component uses standardized text primitives:
   - For web: `Title`, `BodyText`, `Label`, etc. from `Client/packages/ui/` (or `@/components/ui` / `@ui` aliases).
   - Avoid inlining translation keys directly in JSX without `t()`.
3. If the UI previously showed the raw key, re-run or reload the app so it now shows the human-readable copy.

### 5. Lint and Type Hygiene

1. After editing translation modules or barrels, run the relevant linters for the Client:
   - Prefer the unified linter script (see `run-all-linters` skill) or project scripts (e.g. `pnpm lint` / `pnpm typecheck` in `Client`).
2. Ensure:
   - No unused imports were introduced.
   - No `any` types were added (translation maps use `Record<string, string>`).
   - The project-specific ESLint and TypeScript rules still pass.

## Examples

### Example 1: Adding Search Empty-State Text

- New keys appear in a component:
  - `t("search.no_properties_yet")`
  - `t("search.tap_search_to_find")`
- Steps:
  1. Edit `Client/packages/features/search/types/translations.ts`.
  2. Add:
     - `"search.no_properties_yet": "No properties yet",`
     - `"search.tap_search_to_find": "Tap Search to find homes that match your preferences",`
  3. Confirm `SEARCH_TRANSLATIONS` is exported from `types/index.ts` and aggregated in `Client/packages/contexts/translations/index.ts`.

### Example 2: Adding Saved Feature Empty-State Text

- New keys in a saved-homes component:
  - `t("saved.no_properties_yet")`
  - `t("saved.click_heart_to_save")`
- Steps:
  1. Edit `Client/packages/features/saved/types/translations.ts`.
  2. Add entries mirroring the style of existing saved copy (for example, `"No saved homes yet"`, `"Click the heart on a home to save it"`).
  3. Confirm `SAVED_TRANSLATIONS` is exported from the saved feature types barrel and spread into `TRANSLATIONS`.

## When to Prefer Feature Translations vs Shared

- **Feature translations** (`<FEATURE>_TRANSLATIONS`) for:
  - Copy that is specific to a single feature (search, saved, compare, documents, etc.).
  - Empty states, helper text, section labels, and button copy unique to that feature.
- **Shared translations** (`SHARED_TRANSLATIONS`) for:
  - Global actions and labels (Save, Cancel, Loading, Error, etc.).
  - Validation messages and generic feedback.

When adding new text, default to the feature translation map unless the string is clearly global across multiple features.
