# Utils Package

Framework-agnostic utility functions for the SilverKey application.

## Purpose

The `utils/` package provides reusable utility functions that are:

- Framework-agnostic (no React, no framework dependencies)
- Pure functions where possible
- Well-typed with TypeScript
- Testable and reusable

## Architecture Rules

### Allowed Imports

- ✅ Other `utils/*` files - Utilities can use other utilities
- ✅ Third-party libraries - External utility libraries
- ✅ `schemas/*` - Type definitions (type-only imports)

### Forbidden Imports

- ❌ `react` or any React code - Utils must be framework-agnostic
- ❌ `config/*` - Utils should not import config
- ❌ `services/*` - Utils should not import services
- ❌ `hooks/*` - Utils should not import hooks
- ❌ `apps/web/*` - Utils should not import components

## Available Utilities

### Error Handling

- `error.ts` - Simple error conversion utility
- `errorHandling.ts` - Comprehensive error handling utilities

### Type Guards

- `typeGuards.ts` - Runtime type checking functions

### Array Utilities

- `array.ts` - Array manipulation utilities

### Property Utilities

- `property.ts` - Property-related utilities

### Address Utilities

- `address.ts` - Address formatting and parsing

### Currency Utilities

- `currency.ts` - Currency and number formatting (`formatUSD`, `formatCompactUSD`, `formatNumber`, `formatCompactNumber`, `formatPercentage`)

### PDF Utilities

- `pdf.ts` - PDF generation and manipulation

### Routing Utilities

- `routing.ts` - Routing helpers

### Scheduling Utilities

- `scheduling.ts` - Scheduling helpers

### Storage Utilities

- `storage.ts` - LocalStorage utilities (framework-agnostic)

### Auth Utilities

- `auth.ts` - Authentication helpers (deprecated - use config/auth.ts)

## Usage

Import from the barrel `packages/utils` or from domain paths (e.g. `packages/utils/format`, `packages/utils/errorHandling`, `packages/utils/calendar/scheduling`).

## Usage Examples

### Error Handling

```typescript
import {
  normalizeError,
  reportError,
} from "../../../packages/utils/errorHandling";

try {
  // ... code
} catch (error) {
  const normalizedError = normalizeError(error);
  reportError(normalizedError);
}
```

### Type Guards

```typescript
import { isString, isObject } from "../../../packages/utils";

if (isString(value)) {
  // TypeScript knows value is string
  console.log(value.toUpperCase());
}
```

### Array Utilities

```typescript
import { sameIds } from "../../../packages/utils";

const areSame = sameIds(array1, array2);
```

### Storage Utilities

```typescript
import { getFromStorage, setToStorage } from "../../../packages/utils";

const value = getFromStorage<string>("key", { defaultValue: "" });
setToStorage("key", newValue);
```

## Best Practices

1. **Keep utilities pure** - Prefer pure functions
2. **No side effects** - Avoid global state or side effects
3. **Framework-agnostic** - No React or framework dependencies
4. **Well-typed** - Use TypeScript types from `schemas/*`
5. **Documented** - Add JSDoc comments for complex functions

## React-Specific Utilities

For React-specific utilities, see:

- `hooks/ui` (auth: useLocalStorage) - React hook for localStorage
- `hooks/ui` (core: useModal) - React hook for modals
- etc.

## Further Reading

- [packages/README.md](../README.md) - Packages overview
- [hooks/ui/README.md](../hooks/ui/README.md) - React-specific UI hooks
