// Barrel exports for clean public API

// ============================================================================
// NON-STATE CONTEXTS (Service Injection, Theming, Localization)
// ============================================================================

// Authentication (migrated to Zustand stores)
export { useAuthStoreIntegration as useAuth } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";

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
export { SearchRefreshProvider } from "../features/search/hooks/searchRefresh/SearchRefreshContext";
export { useSearchRefresh } from "../features/search/hooks/searchRefresh/useSearchRefresh";

// Migrated to Zustand stores - use these store integration hooks:
export { useChats } from "packages/features/messaging/hooks/data/useChats";

// Store integration hooks (recommended for components):
export { useDocumentsStoreIntegration as useDocuments } from "@/features/documents/hooks/store/useDocumentsStoreIntegration";
export { useReportsStoreIntegration as useReports } from "@/features/documents/hooks/store/useReportsStoreIntegration";
export { useUserStoreIntegration as useUser } from "@/features/homeauth/hooks/store/useUserStoreIntegration";
export { useUserStoreIntegration as usePreferences } from "@/features/homeauth/hooks/store/useUserStoreIntegration";
export { useNegotiationStoreIntegration as useNegotiation } from "@/features/negotiate/hooks/store/useNegotiationStoreIntegration";
export { useSavedHomesStoreIntegration as useSavedHomes } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";
export { useFeature } from "packages/hooks/store/featureFlags/useFeature";
export { useFeatureFlagsStoreIntegration as useFeatureFlags } from "packages/hooks/store/featureFlags/useFeatureFlagsStoreIntegration";
export { useGoogleMapsStoreIntegration as useGoogleMaps } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";
export { useFiltersStoreIntegration as useFilters } from "packages/hooks/store/useFiltersStoreIntegration";
export { useSessionStoreIntegration as useSession } from "packages/hooks/store/useSessionStoreIntegration";
export { useUIStoreIntegration as useUI } from "packages/hooks/store/useUIStoreIntegration";
