// Barrel exports for clean public API

// ============================================================================
// NON-STATE CONTEXTS (Service Injection, Theming, Localization)
// ============================================================================

// Authentication (migrated to Zustand stores)
export { useAuthStoreIntegration as useAuth } from "../hooks/store/useAuthStoreIntegration";

// Service injection (non-state)
export { ServiceProvider, useServices } from "./ServiceContext";

// Theming (non-state configuration)
export { ThemeProvider, useTheme } from "./ThemeContext";

// Localization (non-state i18n utilities)
export { LocalizationProvider, useLocalization } from "./LocalizationContext";

// Migrated to Zustand stores - use these store integration hooks:
export { useChats } from "../hooks/data/useChats";

// Store integration hooks (recommended for components):
export { useSavedHomesStoreIntegration as useSavedHomes } from "../hooks/store/useSavedHomesStoreIntegration";
export { useReportsStoreIntegration as useReports } from "../hooks/store/useReportsStoreIntegration";
export { useDocumentsStoreIntegration as useDocuments } from "../hooks/store/useDocumentsStoreIntegration";
export { useUserStoreIntegration as useUser } from "../hooks/store/useUserStoreIntegration";
export { useUserStoreIntegration as usePreferences } from "../hooks/store/useUserStoreIntegration";
export { useNegotiationStoreIntegration as useNegotiation } from "../hooks/store/useNegotiationStoreIntegration";
export { useGoogleMapsStoreIntegration as useGoogleMaps } from "../hooks/store/useGoogleMapsStoreIntegration";
export { useSessionStoreIntegration as useSession } from "../hooks/store/useSessionStoreIntegration";
export { useUIStoreIntegration as useUI } from "../hooks/store/useUIStoreIntegration";
export { useFeatureFlagsStoreIntegration as useFeatureFlags } from "../hooks/store/useFeatureFlagsStoreIntegration";
export { useFiltersStoreIntegration as useFilters } from "../hooks/store/useFiltersStoreIntegration";
export { useViewStoreIntegration as useView } from "../hooks/store/useViewStoreIntegration";
