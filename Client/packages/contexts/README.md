# Contexts Package

React Context providers for non-state configuration: theming and localization (i18n).

## Purpose

The `contexts/` package provides:

- **Localization** — `LocalizationProvider`, `useLocalization`
- **Theme** — `ThemeContext` (app roots use platform theme providers from `apps/web` or `apps/mobile`)

**Note:** Application state belongs in Zustand (`packages/store`) and store integration hooks (`packages/hooks/store`). Auth, feature flags, search refresh, and feature data hooks are **not** re-exported from this barrel.

## Architecture Rules

### Allowed Imports

- `hooks/*` — context logic only
- `schemas/*`, `utils/*`

### Forbidden Imports

- `packages/features/*` — no feature modules in contexts
- `config/api/*`, `services/*`, `apps/*`

## Usage

```typescript
import { LocalizationProvider, useLocalization } from "packages/contexts";
import { ThemeContext } from "packages/contexts/ThemeContext";
```

### Related imports (not from `packages/contexts`)

| Need | Import from |
| ---- | ----------- |
| Auth integration | `packages/features/homeauth/hooks/store/useAuthStoreIntegration` |
| Feature flags | `packages/hooks/store/featureFlags/useFeature` |
| Search refresh | `packages/features/search/hooks/searchRefresh/` |
| Store integrations | `packages/hooks/store` |

## Context vs Store

- **Contexts:** i18n, theme configuration, provider wrappers
- **Stores:** user data, UI state, feature state

## Further Reading

- [packages/README.md](../README.md)
- [documentation/architecture/shared-packages.md](../../../documentation/architecture/shared-packages.md)
- [store/README.md](../store/README.md)
