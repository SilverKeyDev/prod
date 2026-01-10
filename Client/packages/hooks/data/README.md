# Data Fetching Hooks

React Query hooks for data fetching and API integration.

## Purpose

Data hooks use React Query to fetch and manage data from the API. These hooks:
- Use `config/api/*` for all API calls
- Provide loading, error, and data states
- Handle caching and refetching
- Integrate with React Query's query client

## Architecture Rules

### Allowed Imports
- ✅ `config/api/*` - API clients (primary interface)
- ✅ `config/query/keys.ts` - Query key factories
- ✅ `store/*` - Zustand stores (for integration)
- ✅ `schemas/*` - Type definitions
- ✅ `services/http/*` - HTTP utilities (if needed)
- ✅ `services/security/*` - Security utilities (if needed)

### Forbidden Imports
- ❌ Business logic `services/*` - Use `config/api/*` instead
- ❌ `apps/web/*` - Hooks should not import components

## Available Hooks

### User Data
- `useUserData.ts` - User profile data
- `useSecureAuth.ts` - Secure authentication state

### Agent Data
- `useAgentClients.ts` - Agent clients
- `useAgentTodos.ts` - Agent todos
- `useAgentChats.ts` - Agent conversations
- `useAgentSearch.ts` - Agent search

### Property Data
- `useSavedHomesData.ts` - Saved/favorite homes
- `useNotInterestedHomesData.ts` - Not interested homes
- `usePropertyDetails.ts` - Property details

### Documents
- `useDocuments.ts` - Document list
- `useDocumentActions.ts` - Document actions (upload, delete)

### Scheduling
- `useScheduling.ts` - Scheduling data
- `useGoogleCalendar.ts` - Google Calendar integration

### Maps
- `useGoogleMaps.ts` - Google Maps integration
- `useMapInitialization.ts` - Map initialization

### Other
- `useChats.ts` - Chat conversations
- `useConnectionRequests.ts` - Connection requests
- `usePlaid.ts` - Plaid integration
- `usePlaidIntegration.ts` - Plaid integration state
- `useReportsData.ts` - Reports data
- `useAutoSavePreferences.ts` - Auto-save preferences
- `useDataInitialization.ts` - Initial data loading
- `useDataPolling.ts` - Background data polling
- `useMessaging.ts` - Messaging functionality

## Usage Examples

### Basic Data Hook

```typescript
import { useUserData } from "../../../packages/hooks/data/useUserData";

function Component() {
  const { user, isLoading, error } = useUserData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Hello, {user?.name}</div>;
}
```

### Data Hook with Mutations

```typescript
import { useSavedHomesData } from "../../../packages/hooks/data/useSavedHomesData";

function Component() {
  const { savedHomes, saveHome, removeHome, isLoading } = useSavedHomesData();

  const handleSave = async (homeId: string) => {
    await saveHome(homeId);
  };

  return (
    <div>
      {savedHomes.map((home) => (
        <div key={home.id}>
          {home.address}
          <button onClick={() => removeHome(home.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Custom Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../../config/api/user";
import { queryKeys } from "../../../config/query/keys";

export function useUserData() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const response = await userApi.getProfile();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch user");
      }
      return response.user ?? response.data;
    },
  });
}
```

## Best Practices

1. **Always use `config/api/*`** - Never import business logic services
2. **Use query key factories** - From `config/query/keys.ts`
3. **Handle errors properly** - Check `success` and handle errors
4. **Return consistent structure** - Loading, error, and data states
5. **Use TypeScript types** - From `schemas/*`

## Further Reading

- [hooks/README.md](../README.md) - Hooks package overview
- [config/api/README.md](../../config/api/README.md) - API clients
