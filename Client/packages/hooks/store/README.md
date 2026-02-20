# Store Integration Hooks

Hooks that integrate React Query data with Zustand stores.

## Purpose

Store integration hooks connect data from React Query hooks to Zustand stores, providing:

- Automatic store updates when data changes
- Synchronized state between React Query cache and Zustand stores
- Store selectors and actions
- Clean separation between data fetching and state management

## Architecture Rules

### Allowed Imports

- ✅ `hooks/data/*` - Data fetching hooks
- ✅ `store/*` - Zustand stores
- ✅ `schemas/*` - Type definitions

### Forbidden Imports

- ❌ `config/api/*` - Use data hooks instead
- ❌ `apps/web/*` - Hooks should not import components

## Available Hooks

### Auth

- `useAuthStoreIntegration.ts` - Authentication state integration

### User

- `useUserStoreIntegration.ts` - User profile and preferences

### Saved Homes

- `useSavedHomesStoreIntegration.ts` - Saved homes state

### Documents

- `useDocumentsStoreIntegration.ts` - Documents state

### Reports

- `useReportsStoreIntegration.ts` - Reports state

### Negotiation

- `useNegotiationStoreIntegration.ts` - Negotiation state

### Google Services

- `useGoogleMapsStoreIntegration.ts` - Google Maps state
- `useGoogleCalendarStoreIntegration.ts` - Google Calendar state
- `useMapCleanup.ts` - Map cleanup on unmount

### Search & Feed

- `useSearchViewIntegration.ts` - Search view mode (map/reels) integration

### Other

- `useSessionStoreIntegration.ts` - Session state
- `useUIStoreIntegration.ts` - UI state
- `useFeatureFlagsStoreIntegration.ts` - Feature flags
- `useFiltersStoreIntegration.ts` - Search filters
- `useViewStoreIntegration.ts` - View state
- `usePerformanceMonitoring.ts` - Performance monitoring

## Usage Examples

### Basic Store Integration

```typescript
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/useSavedHomesStoreIntegration";

function Component() {
  const { savedHomes, saveHome, removeHome } = useSavedHomesStoreIntegration();

  return (
    <div>
      {savedHomes.map((home) => (
        <div key={home.id}>{home.address}</div>
      ))}
    </div>
  );
}
```

### Store Integration Pattern

Store integration hooks typically follow this pattern:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useSavedHomesStore } from "../../../store";
import { useSavedHomesData } from "../data/useSavedHomesData";

export function useSavedHomesStoreIntegration() {
  const { data: savedHomes } = useSavedHomesData();
  const setSavedHomes = useSavedHomesStore((s) => s.setSavedHomes);

  useEffect(() => {
    if (savedHomes) {
      setSavedHomes(savedHomes);
    }
  }, [savedHomes, setSavedHomes]);

  // Return store selectors and actions
  return {
    savedHomes: useSavedHomesStore((s) => s.savedHomes),
    saveHome: useSavedHomesStore((s) => s.saveHome),
    removeHome: useSavedHomesStore((s) => s.removeHome),
  };
}
```

## Best Practices

1. **Use data hooks** - Don't fetch data directly in store integration hooks
2. **Sync state automatically** - Use `useEffect` to sync React Query data to stores
3. **Return store interface** - Provide selectors and actions from the store
4. **Handle loading states** - Pass through loading/error states from data hooks

## Further Reading

- [hooks/README.md](../README.md) - Hooks package overview
- [store/README.md](../../store/README.md) - Zustand stores
- [hooks/data/README.md](../data/README.md) - Data fetching hooks
