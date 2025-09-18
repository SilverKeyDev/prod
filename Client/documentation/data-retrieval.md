# Data Retrieval & State Management Strategy

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SILVERKEY STATE ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   CLIENT STATE  │    │  SERVER STATE   │    │   MIDDLEWARE │ │
│  │   (Zustand)     │    │ (TanStack Query)│    │    STACK    │ │
│  │                 │    │                 │    │             │ │
│  │ • UI State      │    │ • API Data      │    │ • persistSafe│ │
│  │ • Session       │    │ • Caching       │    │ • withResettable│ │
│  │ • Filters       │    │ • Mutations     │    │ • withDevtools│ │
│  │ • Preferences   │    │ • Background    │    │             │ │
│  │                 │    │   Refetching    │    │             │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                       │     │
│           └───────────────────────┼───────────────────────┘     │
│                                   │                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DATA FLOW                                 │ │
│  │                                                             │ │
│  │  User Action → Zustand Store → Query Key → TanStack Query   │ │
│  │       ↓              ↓              ↓              ↓       │ │
│  │  UI Update ← Component ← Cache ← API Response ← Server       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Architecture

SilverKey uses a **hybrid state management architecture** combining Zustand
(client state) with TanStack Query (server state) for optimal performance and
developer experience.

### State Taxonomy

```typescript
// CLIENT STATE (Zustand) - UI, Session, Filters, View
const { isAnyModalOpen, enqueueToast, toastQueue } = useUIStore();
const { authReady, isAuthenticated, userMeta } = useSessionStore();
const { activeTab, currentPage, favoriteAddresses, isHomeSaved } = useFiltersStore();
const { sidebarExpanded, personalizationEditMode } = useViewStore();
const { userProfile, userPreferences } = useUserStore();

// SERVER STATE (TanStack Query) - API Data
const { reports, reportsLoading, generateReport, deleteReport } = useReportsData();
const { savedHomes, addSavedHome, removeSavedHome } = useSavedHomesData();
const { userProfile: userProfileData, userPreferences: userPrefsData } = useUserData();
const { chats, sendMessage, getChatHistory } = useChats();
const { documents, uploadDocument, deleteDocument } = useDocuments();
const { propertyDetails, refreshPropertyDetails } = usePropertyDetails();
```

### Key Stores & Hooks

| **Zustand Stores** | **TanStack Query Hooks** | **Purpose**                      |
| ------------------ | ------------------------ | -------------------------------- |
| `useUIStore`       | -                        | Global UI state (modals, toasts, drawers) |
| `useSessionStore`  | -                        | Authentication & session flags   |
| `useFiltersStore`  | -                        | Search filters & pagination      |
| `useViewStore`     | -                        | Sidebar, personalization UI     |
| `useUserStore`     | -                        | User profile & preferences cache |
| `useReportsStore`  | -                        | Reports state management         |
| `useDocumentsStore`| -                        | Document upload state            |
| `useSavedHomesStore`| -                       | Saved homes state management     |
| `useBillingStore`  | -                        | Billing & subscription state     |
| `useNegotiationStore`| -                      | Negotiation state management     |
| -                  | `useReportsData()`       | Reports & compare reports        |
| -                  | `useSavedHomesData()`    | Saved homes management           |
| -                  | `useUserData()`          | User profile & preferences       |
| -                  | `useChats()`             | Chat history & messaging         |
| -                  | `useDocuments()`         | Document uploads & management    |
| -                  | `usePropertyDetails()`   | Property details & information   |
| -                  | `useStripePayment()`     | Payment processing               |

## Data Flow Strategy

### Query Key Discipline

```typescript
// Canonical query keys with filter integration
export const queryKeys = {
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    compare: (reportIds: string[]) => [...queryKeys.reports.all, 'compare', reportIds] as const,
  },
  homes: {
    all: ['homes'] as const,
    favorites: () => [...queryKeys.homes.all, 'favorites'] as const,
    saved: (propertyId: string) => [...queryKeys.homes.all, 'saved', propertyId] as const,
  },
  chats: {
    all: ['chats'] as const,
    lists: () => [...queryKeys.chats.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.chats.lists(), filters] as const,
    history: (reportId: string) => [...queryKeys.chats.all, 'history', reportId] as const,
  },
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.documents.lists(), filters] as const,
    categories: () => [...queryKeys.documents.all, 'categories'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
};

// Filter-reactive queries
const filters = useFiltersQueryParams(); // Zustand → Query params
const { data } = useQuery({
  queryKey: queryKeys.reports.list(filters), // ✅ Reactive to filter changes
  queryFn: () => reportApi.getAll(),
});
```

### Optimistic Updates

```typescript
const deleteReportMutation = useMutation({
  mutationFn: async ({ reportId, s3Key }: { reportId: string; s3Key?: string }) => {
    const response = await reportApi.delete(reportId, s3Key);
    if (!response.success) {
      throw new Error(response.error ?? 'Failed to delete report');
    }
    return response;
  },
  onMutate: ({ reportId }) => {
    // Optimistic update - remove the report from cache
    const previousReports = queryClient.getQueryData(queryKeys.reports.list(filters));
    queryClient.setQueryData(queryKeys.reports.list(filters), (old: Report[] | undefined) => {
      if (!old) return old;
      return old.filter((report) => report.id !== reportId);
    });
    return { previousReports };
  },
  onError: (_error, _variables, context) => {
    // Rollback on error
    if (context?.previousReports) {
      queryClient.setQueryData(queryKeys.reports.list(filters), context.previousReports);
    }
  },
  onSettled: () => {
    // Always refetch after mutation settles
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  },
});
```

### Global UI State

```typescript
// Global toast system
const { enqueueToast, dequeueToast, toastQueue, activeToastId } = useUIStore();

// Usage in components
enqueueToast({
  type: 'success',
  message: 'Report generated successfully!',
});

// Modal and drawer management
const { isAnyModalOpen, openModal, closeModal, toggleModal } = useUIStore();
const { isAnyDrawerOpen, openDrawer, closeDrawer, toggleDrawer } = useUIStore();

// Global loading states
const { isGlobalLoading, setGlobalLoading } = useUIStore();
```

## Loading Patterns

### Authentication-Gated Loading

```typescript
const shouldLoadData = useMemo(() => {
  return authReady && !!user?.id;
}, [authReady, user?.id]);

const { data, isLoading } = useQuery({
  queryKey: queryKeys.reports.list(filters),
  queryFn: () => reportApi.getAll(),
  enabled: shouldLoadData, // ✅ Only loads when authenticated
});
```

### Filter-Reactive Queries

```typescript
// Filter adapter converts Zustand state to query params
export function useFiltersQueryParams() {
  const searchStage = useFiltersStore((s) => s.searchStage);
  const favoriteAddresses = useFiltersStore((s) => s.favoriteAddresses);
  const currentPage = useFiltersStore((s) => s.currentPage);

  return toQueryParams({ searchStage, favoriteAddresses, currentPage });
}

// Pure function for query param conversion
export function toQueryParams(
  state: Pick<FiltersState, 'searchStage' | 'favoriteAddresses' | 'currentPage'>
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length ? state.favoriteAddresses : undefined,
    page: state.currentPage,
  } as const;
}
```

## Performance Optimizations

### Selective Subscriptions

```typescript
// ✅ Good - Only re-renders when specific state changes
const activeTab = useFiltersStore((s) => s.activeTab);
const currentPage = useFiltersStore((s) => s.currentPage);

// ❌ Bad - Re-renders on any state change
const filtersState = useFiltersStore();
```

### Query Caching

```typescript
// Same query key = cached result (no duplicate requests)
const { data: reports1 } = useQuery({
  queryKey: queryKeys.reports.list(filters),
  queryFn: () => reportApi.getAll(),
});

const { data: reports2 } = useQuery({
  queryKey: queryKeys.reports.list(filters), // ✅ Same key = cached
  queryFn: () => reportApi.getAll(),
});
```

## Store Integration Patterns

### Store Integration Hooks

```typescript
// Integration between Zustand stores and TanStack Query
export function useReportsStoreIntegration() {
  const { reports, reportsLoading, reportsError } = useReportsData();
  const { setReports, setReportsLoading, setReportsError } = useReportsStore();

  // Sync TanStack Query state to Zustand store
  useEffect(() => {
    setReports(reports);
  }, [reports, setReports]);

  useEffect(() => {
    setReportsLoading(reportsLoading);
  }, [reportsLoading, setReportsLoading]);

  useEffect(() => {
    setReportsError(reportsError);
  }, [reportsError, setReportsError]);
}

// Similar patterns for other data hooks
export function useDocumentsStoreIntegration() {
  const { documents, documentsLoading, documentsError } = useDocuments();
  const { setDocuments, setDocumentsLoading, setDocumentsError } = useDocumentsStore();
  
  // Sync logic...
}
```

### Cross-Tab Synchronization

```typescript
// Listen for auth changes across tabs
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'id_token') {
      if (e.newValue) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
      } else {
        void queryClient.removeQueries({ queryKey: queryKeys.chats.all });
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [queryClient]);
```

## Security & Best Practices

### Safe Persistence

```typescript
// UI Store - Only persist safe preferences
const withPersist = persistSafe<UIState>(withReset, {
  name: 'ui-store',
  version: 1,
  storage: localStorage,
  partialize: (state: UIState) => ({
    // Persist only safe UI prefs; avoid transient flags
    toastQueue: state.toastQueue,
    isCarouselCollapsed: state.isCarouselCollapsed,
  }),
  migrate: (persisted: unknown): UIState => {
    const base = { ...initialState() } as UIState;
    if (!persisted) return base;
    const pd = persisted as Record<string, unknown>;
    return {
      ...base,
      toastQueue: (pd.toastQueue as ToastItem[]) ?? [],
      isCarouselCollapsed: (pd.isCarouselCollapsed as boolean) ?? false,
    } as UIState;
  },
});

// Filters Store - Persist only benign UI filters
const withPersist = persistSafe<FiltersState>(withReset, {
  name: 'filters-store',
  version: 1,
  storage: localStorage,
  partialize: (state: FiltersState) => ({
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    searchStage: state.searchStage,
  }),
  migrate: (persisted: unknown) => ({ ...initialState(), ...(persisted as object) }) as FiltersState,
});

// User Store - Only persist non-sensitive user data
const withPersist = persistSafe<UserState>(withReset, {
  name: 'user-store',
  version: 1,
  storage: localStorage,
  partialize: (state: UserState) => ({
    userProfile: state.userProfile
      ? {
          id: state.userProfile.id,
          email: state.userProfile.email,
          name: state.userProfile.name,
          username: state.userProfile.username,
          isAgent: state.userProfile.isAgent,
        }
      : null,
    userPreferences: state.userPreferences,
  }),
});
```

### Store Pattern

```typescript
// Consistent store structure with middleware stack
export interface StoreState {
  data: DataType[];
  loading: boolean;
  error: string | null;

  setData: (data: DataType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Store creation with middleware stack
const baseCreator: import('zustand').StateCreator<StoreState> = (set, get) => ({
  ...initialState(),
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => {},
});

const withReset = withResettable<StoreState>(
  baseCreator,
  (set) => ({
    ...initialState(),
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => {},
  })
) as unknown as import('zustand').StateCreator<StoreState>;

const withPersist = persistSafe<StoreState>(withReset, {
  name: 'store-name',
  version: 1,
  storage: localStorage,
  partialize: (state) => ({ /* safe fields only */ }),
  migrate: (persisted) => ({ ...initialState(), ...(persisted as object) }) as StoreState,
}) as unknown as import('zustand').StateCreator<StoreState>;

const withDev = withDevtools<StoreState>('store-name')(withPersist) as unknown as import('zustand').StateCreator<StoreState>;

export const useStore = create<StoreState>()(withDev);
```

## Advanced Data Hooks

### Property Details Management

```typescript
export function usePropertyDetails(): UsePropertyDetailsReturn {
  const {
    data: propertyDetails,
    isLoading: propertyDetailsLoading,
    error: propertyDetailsError,
    refetch: refetchPropertyDetails,
  } = useQuery({
    queryKey: queryKeys.properties.details(propertyId),
    queryFn: async () => {
      const response = await propertyApi.getDetails(propertyId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch property details');
      }
      return response.property;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshPropertyDetails = useCallback(async () => {
    await refetchPropertyDetails();
  }, [refetchPropertyDetails]);

  return {
    propertyDetails: propertyDetails ?? null,
    propertyDetailsLoading,
    propertyDetailsError: propertyDetailsError?.message ?? null,
    refreshPropertyDetails,
  };
}
```

### Payment Processing

```typescript
export function useStripePayment() {
  const queryClient = useQueryClient();

  const createCheckoutSession = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await stripeApi.createCheckoutSession(priceId);
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create checkout session');
      }
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    },
  });

  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await stripeApi.createPortalSession();
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create portal session');
      }
      return response;
    },
  });

  return {
    createCheckoutSession: createCheckoutSession.mutateAsync,
    createPortalSession: createPortalSession.mutateAsync,
    isCreatingCheckout: createCheckoutSession.isPending,
    isCreatingPortal: createPortalSession.isPending,
  };
}
```

## Migration Benefits

| **Aspect**      | **Before (Context)**             | **After (Zustand + TanStack Query)** |
| --------------- | -------------------------------- | ------------------------------------ |
| **Performance** | Re-renders on any context change | Selective subscriptions              |
| **Caching**     | Manual cache management          | Automatic query caching              |
| **Type Safety** | Partial TypeScript support       | Full type inference                  |
| **Debugging**   | Limited debugging tools          | Redux DevTools integration           |
| **Persistence** | Manual localStorage handling     | Safe, versioned persistence          |
| **Testing**     | Complex context mocking          | Pure functions, easy testing         |
| **Store Count** | 1-2 large contexts              | 9 focused, single-purpose stores    |
| **Data Hooks**  | Manual API calls                | 7 specialized data hooks            |
| **Middleware**  | None                            | 3-layer middleware stack            |
| **Cross-tab**   | No synchronization              | Automatic auth state sync           |

## Current Implementation Summary

The SilverKey application now uses a comprehensive state management architecture with:

- **9 Zustand Stores**: UI, Session, Filters, View, User, Reports, Documents, SavedHomes, Billing, Negotiation
- **7 TanStack Query Hooks**: Reports, SavedHomes, User, Chats, Documents, PropertyDetails, StripePayment
- **3 Middleware Layers**: DevTools, PersistSafe, WithResettable
- **Comprehensive Query Keys**: Organized by domain with filter integration
- **Store Integration**: Hooks that sync TanStack Query state to Zustand stores
- **Cross-tab Sync**: Automatic invalidation on auth state changes
- **Safe Persistence**: Versioned, partialized storage with migration support

This modern architecture provides optimal performance, developer experience, and
maintainability while ensuring secure data handling across the SilverKey
application.
