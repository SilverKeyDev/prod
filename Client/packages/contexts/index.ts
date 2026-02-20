// Barrel exports for clean public API

// ============================================================================
// NON-STATE CONTEXTS (Service Injection, Theming, Localization)
// ============================================================================

// Authentication (migrated to Zustand stores)
export { useAuthStoreIntegration as useAuth } from "packages/hooks/store/auth/useAuthStoreIntegration";

// Service injection (non-state)
export { ServiceProvider, useServices } from "./ServiceContext";

// Theming (non-state configuration). Provider is web-only; use ThemeProviderWeb from apps/web at root.
export {
  type ThemeConfig,
  ThemeContext,
  type ThemeContextType,
  defaultConfig as themeDefaultConfig,
  type ThemeMode,
  type ThemeProviderProps,
  useTheme,
} from "./ThemeContext";

// Localization (non-state i18n utilities)
export { LocalizationProvider, useLocalization } from "./LocalizationContext";

// Search refresh (e.g. Reels refresh when clicking Search nav)
export { SearchRefreshProvider } from "./SearchRefreshContext";
export { useSearchRefresh } from "./useSearchRefresh";

// Migrated to Zustand stores - use these store integration hooks:
export { useChats } from "packages/hooks/data/chat/useChats";

// Store integration hooks (recommended for components):
export { useUserStoreIntegration as useUser } from "packages/hooks/store/auth/useUserStoreIntegration";
export { useUserStoreIntegration as usePreferences } from "packages/hooks/store/auth/useUserStoreIntegration";
export { useDocumentsStoreIntegration as useDocuments } from "packages/hooks/store/documents/useDocumentsStoreIntegration";
export { useReportsStoreIntegration as useReports } from "packages/hooks/store/documents/useReportsStoreIntegration";
export { useFeature } from "packages/hooks/store/featureFlags/useFeature";
export { useFeatureFlagsStoreIntegration as useFeatureFlags } from "packages/hooks/store/featureFlags/useFeatureFlagsStoreIntegration";
export { useFiltersStoreIntegration as useFilters } from "packages/hooks/store/filters/useFiltersStoreIntegration";
export { useGoogleMapsStoreIntegration as useGoogleMaps } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";
export { useNegotiationStoreIntegration as useNegotiation } from "packages/hooks/store/negotiation/useNegotiationStoreIntegration";
export { useSavedHomesStoreIntegration as useSavedHomes } from "packages/hooks/store/search/useSavedHomesStoreIntegration";
export { useSessionStoreIntegration as useSession } from "packages/hooks/store/session/useSessionStoreIntegration";
export { useUIStoreIntegration as useUI } from "packages/hooks/store/ui/useUIStoreIntegration";
