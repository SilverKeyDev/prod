# Contexts Package

React Context providers for dependency injection and non-state configuration.

## Purpose

The `contexts/` package provides React Context providers for:
- Service injection (dependency injection)
- Theming configuration
- Localization (i18n)

**Note**: These contexts are for **non-state** configuration. For state management, use Zustand stores in `store/`.

## Architecture Rules

### Allowed Imports
- ✅ `hooks/*` - Can use hooks for context logic
- ✅ `schemas/*` - Type definitions
- ✅ `utils/*` - Utility functions

### Forbidden Imports
- ❌ `config/api/*` - Contexts should not make API calls
- ❌ `services/*` - Contexts should not use services directly
- ❌ `apps/web/*` - Contexts should not import components

## Available Contexts

### Service Context
- `ServiceContext.tsx` - Dependency injection for services

### Theme Context
- `ThemeContext.tsx` - Theming configuration and utilities

### Localization Context
- `LocalizationContext.tsx` - Internationalization (i18n) utilities

## Usage Examples

### Service Context

```typescript
import { ServiceProvider, useServices } from "../../../packages/contexts";

function App() {
  return (
    <ServiceProvider>
      <MyComponent />
    </ServiceProvider>
  );
}

function MyComponent() {
  const services = useServices();
  // Use injected services
}
```

### Theme Context

```typescript
import { ThemeProvider, useTheme } from "../../../packages/contexts";

function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  // Use theme
}
```

### Localization Context

```typescript
import { LocalizationProvider, useLocalization } from "../../../packages/contexts";

function App() {
  return (
    <LocalizationProvider>
      <MyComponent />
    </LocalizationProvider>
  );
}

function MyComponent() {
  const { t, locale, setLocale } = useLocalization();
  // Use localization
}
```

## Context vs Store

### Use Contexts For:
- Dependency injection
- Non-state configuration (theming, i18n)
- Provider components

### Use Stores For:
- Application state
- User data
- UI state that needs to be shared

## Best Practices

1. **Use for configuration** - Contexts are for non-state configuration
2. **Don't use for state** - Use Zustand stores for state management
3. **Provide at app level** - Wrap providers at the root of the app
4. **Keep contexts focused** - One context per concern

## Further Reading

- [packages/README.md](../README.md) - Packages overview
- [store/README.md](../store/README.md) - Zustand stores for state management
