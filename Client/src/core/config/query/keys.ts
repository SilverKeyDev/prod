/**
 * Canonical query keys for React Query
 * Organized by domain to ensure consistent key structure
 */

export const queryKeys = {
  // Reports domain
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    compare: (reportIds: string[]) => [...queryKeys.reports.all, 'compare', reportIds] as const,
    downloadUrl: (id: string) => [...queryKeys.reports.all, 'downloadUrl', id] as const,
    viewUrl: (id: string) => [...queryKeys.reports.all, 'viewUrl', id] as const,
  },

  // Billing/Subscription domain
  billing: {
    all: ['billing'] as const,
    subscription: () => [...queryKeys.billing.all, 'subscription'] as const,
    checkoutSession: (priceId: string) => [...queryKeys.billing.all, 'checkout', priceId] as const,
    portalSession: () => [...queryKeys.billing.all, 'portal'] as const,
  },

  // Saved Homes domain
  homes: {
    all: ['homes'] as const,
    favorites: () => [...queryKeys.homes.all, 'favorites'] as const,
    saved: (propertyId: string) => [...queryKeys.homes.all, 'saved', propertyId] as const,
  },

  // Chats domain
  chats: {
    all: ['chats'] as const,
    lists: () => [...queryKeys.chats.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.chats.lists(), filters] as const,
    history: (reportId: string) => [...queryKeys.chats.all, 'history', reportId] as const,
  },

  // Documents domain
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.documents.lists(), filters] as const,
    categories: () => [...queryKeys.documents.all, 'categories'] as const,
    byCategory: (category: string) => [...queryKeys.documents.all, 'byCategory', category] as const,
    byProperty: (propertyId: string) =>
      [...queryKeys.documents.all, 'byProperty', propertyId] as const,
    byOffer: (offerId: string) => [...queryKeys.documents.all, 'byOffer', offerId] as const,
  },

  // Property details domain
  properties: {
    all: ['properties'] as const,
    details: (propertyId: string) => [...queryKeys.properties.all, 'details', propertyId] as const,
  },

  // Map initialization domain
  maps: {
    all: ['maps'] as const,
    initialization: () => [...queryKeys.maps.all, 'init'] as const,
  },

  // User profile domain
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKey = typeof queryKeys;
